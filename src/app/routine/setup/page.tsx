'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, GripVertical, ChevronRight, Loader2, CheckCircle2, Sparkles, Copy } from 'lucide-react'
import { t } from '@/lib/i18n'

type Category = 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'eye_cream' | 'sunscreen' | 'treatment' | 'other'

const CATEGORY_LABELS = t.routine.categories as Record<Category, string>
const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]

interface ProductDraft {
  id: string
  dbId?: string
  brand: string
  name: string
  category: Category | ''
  routineType: 'am' | 'pm' | 'both'
  copiedFromAm?: boolean
  isExisting?: boolean
}

export default function RoutineSetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [amProducts, setAmProducts] = useState<ProductDraft[]>([])
  const [pmProducts, setPmProducts] = useState<ProductDraft[]>([])
  const [activeTab, setActiveTab] = useState<'am' | 'pm'>('am')
  const [showAddForm, setShowAddForm] = useState(false)
  const [draft, setDraft] = useState<{ brand: string; name: string; category: Category | '' }>({ brand: '', name: '', category: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { setLoading(false); return }
        setUserId(user.id)

        // Step 1：獨立查詢 user_routines（不使用 embedded join，避免 RLS 靜默失敗）
        const { data: routines, error: routineErr } = await supabase
          .from('user_routines')
          .select('id, product_id, routine_type, step_order')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('routine_type')
          .order('step_order')

        if (routineErr) throw new Error(`載入 routine 失敗：${routineErr.message}`)

        if (routines && routines.length > 0) {
          // Step 2：用 product_id 清單查詢 user_products
          const productIds = [...new Set(routines.map((r: any) => r.product_id))]
          const { data: products, error: productErr } = await supabase
            .from('user_products')
            .select('id, brand, name, category')
            .in('id', productIds)

          if (productErr) throw new Error(`載入產品資料失敗：${productErr.message}`)

          // 建立 id → product 對照表
          const productMap = new Map<string, any>((products ?? []).map((p: any) => [p.id, p]))

          const am: ProductDraft[] = []
          const pm: ProductDraft[] = []

          routines.forEach((r: any) => {
            const prod = productMap.get(r.product_id)
            if (!prod) return
            const base: ProductDraft = {
              id: `existing-${r.id}`,
              dbId: r.product_id,
              brand: prod.brand ?? '',
              name: prod.name ?? '',
              category: (prod.category ?? '') as Category | '',
              routineType: r.routine_type,
              isExisting: true,
            }
            if (r.routine_type === 'am' || r.routine_type === 'both') am.push(base)
            if (r.routine_type === 'pm' || r.routine_type === 'both') pm.push({ ...base, id: `existing-pm-${r.id}` })
          })

          setAmProducts(am)
          setPmProducts(pm)
        }
        // （沒有 routine 時頁面保持空白，讓使用者從頭設定）
      } catch (err: any) {
        setLoadError(err instanceof Error ? err.message : t.routine.load_error_title)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const copyAmToPm = () => {
    if (amProducts.length === 0) return
    setPmProducts(prev => {
      const existing = new Set(prev.map(p => `${p.brand}|${p.name}`))
      const toAdd = amProducts
        .filter(p => !existing.has(`${p.brand}|${p.name}`))
        .map(p => ({ ...p, id: `tmp-copy-${Date.now()}-${p.id}`, routineType: 'pm' as const, copiedFromAm: true, isExisting: false, dbId: undefined }))
      return [...prev, ...toAdd]
    })
  }

  const handleAddProduct = () => {
    if (!draft.brand.trim() || !draft.name.trim()) return
    const newProduct: ProductDraft = {
      id: `tmp-${Date.now()}`,
      brand: draft.brand.trim(),
      name: draft.name.trim(),
      category: draft.category,
      routineType: activeTab,
    }
    if (activeTab === 'am') setAmProducts(prev => [...prev, newProduct])
    else setPmProducts(prev => [...prev, newProduct])
    setDraft({ brand: '', name: '', category: '' })
    setShowAddForm(false)
  }

  const removeProduct = async (product: ProductDraft) => {
    if (product.isExisting && product.dbId && userId) {
      await supabase.from('user_routines').delete().eq('user_id', userId).eq('product_id', product.dbId)
    }
    if (activeTab === 'am') setAmProducts(prev => prev.filter(p => p.id !== product.id))
    else setPmProducts(prev => prev.filter(p => p.id !== product.id))
  }

  const handleDragStart = (index: number) => setDragIndex(index)
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const list = activeTab === 'am' ? [...amProducts] : [...pmProducts]
    const [moved] = list.splice(dragIndex, 1)
    list.splice(index, 0, moved)
    if (activeTab === 'am') setAmProducts(list)
    else setPmProducts(list)
    setDragIndex(index)
  }
  const handleDragEnd = () => setDragIndex(null)

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    try {
      const allNew = [...amProducts, ...pmProducts].filter(p => !p.isExisting)
      for (const p of allNew) {
        const { data: inserted, error } = await supabase
          .from('user_products')
          .insert({ user_id: userId, brand: p.brand, name: p.name, category: p.category || null, is_active: true })
          .select('id').single()
        if (error || !inserted) continue
        const list = p.routineType === 'am' ? amProducts : pmProducts
        await supabase.from('user_routines').upsert({
          user_id: userId, product_id: inserted.id, routine_type: p.routineType,
          step_order: list.findIndex(x => x.id === p.id), is_active: true,
        }, { onConflict: 'user_id,product_id,routine_type' })
      }
      await supabase.from('skin_profiles')
        .update({ routine_setup_completed_at: new Date().toISOString() })
        .eq('user_id', userId)
      setSaved(true)
      setTimeout(() => router.push('/dashboard/profile'), 1500)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const currentList = activeTab === 'am' ? amProducts : pmProducts
  const newCount = [...amProducts, ...pmProducts].filter(p => !p.isExisting).length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-rose-300" />
        <span className="text-sm text-stone-400">{t.routine.loading}</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-3xl">😵</div>
        <p className="text-sm font-medium text-stone-700 text-center">{t.routine.load_error_title}</p>
        <p className="text-xs text-red-400 text-center">{loadError}</p>
        <button onClick={() => window.location.reload()}
          className="px-4 py-2 bg-rose-400 text-white rounded-xl text-sm font-medium">
          {t.routine.reload}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <div className="bg-white border-b border-stone-100 px-4 py-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-medium text-rose-400 tracking-widest uppercase">Skincare</span>
        </div>
        <h1 className="text-xl font-semibold text-stone-800">{t.routine.title}</h1>
        <p className="text-sm text-stone-500 mt-1">{t.routine.subtitle}</p>
      </div>

      <div className="flex mx-4 mt-4 bg-stone-100 rounded-xl p-1 gap-1">
        {(['am', 'pm'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setShowAddForm(false) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}>
            {tab === 'am' ? t.routine.tab_am : t.routine.tab_pm}
            {tab === 'am' && amProducts.length > 0 && <span className="ml-1 text-xs text-rose-400">({amProducts.length})</span>}
            {tab === 'pm' && pmProducts.length > 0 && <span className="ml-1 text-xs text-rose-400">({pmProducts.length})</span>}
          </button>
        ))}
      </div>

      {activeTab === 'pm' && amProducts.length > 0 && (
        <div className="mx-4 mt-3">
          <button onClick={copyAmToPm}
            className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-left hover:bg-amber-100 active:scale-[0.98] transition-all">
            <Copy className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700">{t.routine.copy_am}</p>
              <p className="text-xs text-amber-500 mt-0.5">{t.routine.copy_am_body(amProducts.length)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
          </button>
        </div>
      )}

      <div className="flex-1 px-4 mt-4 space-y-2">
        {currentList.length === 0 && !showAddForm && (
          <div className="text-center py-12 text-stone-400">
            <div className="text-4xl mb-3">{activeTab === 'am' ? '☀️' : '🌙'}</div>
            <p className="text-sm">{t.routine.empty_am}</p>
            <p className="text-xs mt-1">{activeTab === 'pm' && amProducts.length > 0 ? t.routine.empty_hint_pm : t.routine.empty_hint_am}</p>
          </div>
        )}

        {currentList.map((product, index) => (
          <div key={product.id} draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`bg-white rounded-xl p-3 flex items-center gap-3 border transition-all ${dragIndex === index ? 'border-rose-300 shadow-md opacity-70' : 'border-stone-100'}`}>
            <GripVertical className="w-4 h-4 text-stone-300 cursor-grab flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-stone-400">{product.brand}</span>
                <span className="text-sm font-medium text-stone-800 truncate">{product.name}</span>
                {product.isExisting && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">{t.routine.saved_badge}</span>}
                {product.copiedFromAm && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">{t.routine.copied_badge}</span>}
              </div>
              {product.category && <span className="text-xs text-stone-400 mt-0.5 block">{CATEGORY_LABELS[product.category as Category]}</span>}
            </div>
            <span className="text-xs text-stone-300 flex-shrink-0">#{index + 1}</span>
            <button onClick={() => removeProduct(product)} className="text-stone-300 hover:text-rose-400 transition-colors flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {showAddForm && (
          <div className="bg-white rounded-xl p-4 border border-rose-200 space-y-3">
            <p className="text-sm font-medium text-stone-700">{activeTab === 'am' ? t.routine.form_title_am : t.routine.form_title_pm}</p>
            <input type="text" placeholder={t.routine.brand_placeholder} value={draft.brand}
              onChange={e => setDraft(d => ({ ...d, brand: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-rose-300" autoFocus />
            <input type="text" placeholder={t.routine.name_placeholder} value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-rose-300" />
            <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value as Category }))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-rose-300 text-stone-600">
              <option value="">{t.routine.category_placeholder}</option>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => { setShowAddForm(false); setDraft({ brand: '', name: '', category: '' }) }}
                className="flex-1 py-2 text-sm text-stone-500 border border-stone-200 rounded-lg">{t.general.cancel}</button>
              <button onClick={handleAddProduct} disabled={!draft.brand.trim() || !draft.name.trim()}
                className="flex-1 py-2 text-sm font-medium bg-rose-400 text-white rounded-lg disabled:opacity-40">{t.products.add}</button>
            </div>
          </div>
        )}

        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)}
            className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-sm text-stone-400 flex items-center justify-center gap-2 hover:border-rose-300 hover:text-rose-400 transition-colors">
            <Plus className="w-4 h-4" />
            {activeTab === 'pm' ? t.routine.add_pm : t.routine.add_am}
          </button>
        )}
      </div>

      <div className="px-4 py-6 space-y-3">
        {saved ? (
          <div className="flex items-center justify-center gap-2 py-4 text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{t.routine.saved}</span>
          </div>
        ) : (
          <>
            <button onClick={handleSave} disabled={saving || newCount === 0}
              className="w-full py-3.5 bg-rose-400 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />{t.routine.saving}</>
                : newCount > 0 ? <>{t.routine.save(newCount)} <ChevronRight className="w-4 h-4" /></>
                : t.routine.nothing_to_save}
            </button>
            <button onClick={() => router.back()} className="w-full py-2 text-sm text-stone-400 text-center">{t.routine.back}</button>
          </>
        )}
      </div>
    </div>
  )
}
