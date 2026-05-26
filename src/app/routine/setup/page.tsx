'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, GripVertical, ChevronRight, Loader2, CheckCircle2, Sparkles, Copy } from 'lucide-react'

type Category =
  | 'cleanser' | 'toner' | 'serum' | 'moisturizer'
  | 'eye_cream' | 'sunscreen' | 'treatment' | 'other'

const CATEGORY_LABELS: Record<Category, string> = {
  cleanser:    '潔面',
  toner:       '化妝水 / 精華液',
  serum:       '精華 / 安瓶',
  moisturizer: '乳霜 / 乳液',
  eye_cream:   '眼霜',
  sunscreen:   '防曬',
  treatment:   '特殊保養 / 面膜',
  other:       '其他',
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]

interface ProductDraft {
  id: string
  brand: string
  name: string
  category: Category | ''
  routineType: 'am' | 'pm' | 'both'
  copiedFromAm?: boolean // 標記是從 AM 複製過來的
}

export default function RoutineSetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [amProducts, setAmProducts] = useState<ProductDraft[]>([])
  const [pmProducts, setPmProducts] = useState<ProductDraft[]>([])
  const [activeTab, setActiveTab] = useState<'am' | 'pm'>('am')
  const [showAddForm, setShowAddForm] = useState(false)
  const [draft, setDraft] = useState<{ brand: string; name: string; category: Category | '' }>({
    brand: '', name: '', category: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  // ── 與早上相同：把 AM 產品全部複製到 PM ──
  const copyAmToPm = () => {
    if (amProducts.length === 0) return
    const copied: ProductDraft[] = amProducts.map(p => ({
      ...p,
      id: `tmp-copy-${Date.now()}-${p.id}`,
      routineType: 'pm',
      copiedFromAm: true,
    }))
    // 只加入 PM 裡還沒有的（用 brand+name 判斷）
    setPmProducts(prev => {
      const existing = new Set(prev.map(p => `${p.brand}|${p.name}`))
      const toAdd = copied.filter(p => !existing.has(`${p.brand}|${p.name}`))
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

  const removeProduct = (id: string) => {
    if (activeTab === 'am') setAmProducts(prev => prev.filter(p => p.id !== id))
    else setPmProducts(prev => prev.filter(p => p.id !== id))
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
      const allProducts = [...amProducts, ...pmProducts]
      for (const p of allProducts) {
        const { data: inserted, error } = await supabase
          .from('user_products')
          .insert({ user_id: userId, brand: p.brand, name: p.name, category: p.category || null, is_active: true })
          .select('id').single()
        if (error || !inserted) continue
        await supabase.from('user_routines').upsert({
          user_id: userId,
          product_id: inserted.id,
          routine_type: p.routineType,
          step_order: (p.routineType === 'am' ? amProducts : pmProducts).findIndex(x => x.id === p.id),
          is_active: true,
        }, { onConflict: 'user_id,product_id,routine_type' })
      }
      await supabase.from('skin_profiles')
        .update({ routine_setup_completed_at: new Date().toISOString() })
        .eq('user_id', userId)
      setSaved(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      console.error('Save routine error:', err)
    } finally {
      setSaving(false)
    }
  }

  const currentList = activeTab === 'am' ? amProducts : pmProducts
  const totalCount = amProducts.length + pmProducts.length

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-medium text-rose-400 tracking-widest uppercase">Step Final</span>
        </div>
        <h1 className="text-xl font-semibold text-stone-800">設定我的 Routine</h1>
        <p className="text-sm text-stone-500 mt-1">加入你每天早晚使用的保養品，之後 check-in 只需快速勾選</p>
      </div>

      {/* Tab Selector */}
      <div className="flex mx-4 mt-4 bg-stone-100 rounded-xl p-1 gap-1">
        {(['am', 'pm'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setShowAddForm(false) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'
            }`}
          >
            {tab === 'am' ? '☀️ 早上 AM' : '🌙 晚上 PM'}
            {tab === 'am' && amProducts.length > 0 && (
              <span className="ml-1 text-xs text-rose-400">({amProducts.length})</span>
            )}
            {tab === 'pm' && pmProducts.length > 0 && (
              <span className="ml-1 text-xs text-rose-400">({pmProducts.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* 「與早上相同」提示區塊（只在 PM tab 且 AM 有產品時顯示） */}
      {activeTab === 'pm' && amProducts.length > 0 && (
        <div className="mx-4 mt-3">
          <button
            onClick={copyAmToPm}
            className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-left transition-all hover:bg-amber-100 active:scale-[0.98]"
          >
            <Copy className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700">與早上相同</p>
              <p className="text-xs text-amber-500 mt-0.5">
                複製早上 {amProducts.length} 個產品，再自行新增晚上專用的
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Product List */}
      <div className="flex-1 px-4 mt-4 space-y-2">
        {currentList.length === 0 && !showAddForm && (
          <div className="text-center py-12 text-stone-400">
            <div className="text-4xl mb-3">{activeTab === 'am' ? '☀️' : '🌙'}</div>
            <p className="text-sm">還沒有加入任何產品</p>
            <p className="text-xs mt-1">
              {activeTab === 'pm' && amProducts.length > 0
                ? '點上方「與早上相同」快速複製，或手動新增'
                : '點下方「新增產品」開始設定'}
            </p>
          </div>
        )}

        {currentList.map((product, index) => (
          <div
            key={product.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`bg-white rounded-xl p-3 flex items-center gap-3 border transition-all ${
              dragIndex === index ? 'border-rose-300 shadow-md opacity-70' : 'border-stone-100'
            }`}
          >
            <GripVertical className="w-4 h-4 text-stone-300 cursor-grab flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-400">{product.brand}</span>
                <span className="text-sm font-medium text-stone-800 truncate">{product.name}</span>
                {product.copiedFromAm && (
                  <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    早上
                  </span>
                )}
              </div>
              {product.category && (
                <span className="text-xs text-stone-400 mt-0.5 block">
                  {CATEGORY_LABELS[product.category as Category]}
                </span>
              )}
            </div>
            <span className="text-xs text-stone-300 flex-shrink-0">#{index + 1}</span>
            <button
              onClick={() => removeProduct(product.id)}
              className="text-stone-300 hover:text-rose-400 transition-colors flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl p-4 border border-rose-200 space-y-3">
            <p className="text-sm font-medium text-stone-700">
              新增{activeTab === 'am' ? '早上' : '晚上'}產品
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="品牌名稱（如：Cetaphil、蘭蔻）"
                value={draft.brand}
                onChange={e => setDraft(d => ({ ...d, brand: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-rose-300"
                autoFocus
              />
              <input
                type="text"
                placeholder="產品名稱（如：溫和潔面乳）"
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-rose-300"
              />
              <select
                value={draft.category}
                onChange={e => setDraft(d => ({ ...d, category: e.target.value as Category }))}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-rose-300 text-stone-600"
              >
                <option value="">選擇分類（選填）</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAddForm(false); setDraft({ brand: '', name: '', category: '' }) }}
                className="flex-1 py-2 text-sm text-stone-500 border border-stone-200 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleAddProduct}
                disabled={!draft.brand.trim() || !draft.name.trim()}
                className="flex-1 py-2 text-sm font-medium bg-rose-400 text-white rounded-lg disabled:opacity-40"
              >
                加入
              </button>
            </div>
          </div>
        )}

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-sm text-stone-400 flex items-center justify-center gap-2 hover:border-rose-300 hover:text-rose-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增{activeTab === 'pm' ? '晚上專用' : ''}產品
          </button>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-4 py-6 space-y-3">
        {saved ? (
          <div className="flex items-center justify-center gap-2 py-4 text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Routine 已儲存！正在跳轉...</span>
          </div>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving || totalCount === 0}
              className="w-full py-3.5 bg-rose-400 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 儲存中...</>
              ) : (
                <>儲存 Routine <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-2 text-sm text-stone-400 text-center"
            >
              先跳過，稍後再設定
            </button>
          </>
        )}
      </div>
    </div>
  )
}
