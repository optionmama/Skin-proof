'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Plus, X, Loader2, Sun, Moon, Edit2, Trash2, Check } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

type Category = 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'eye_cream' | 'sunscreen' | 'treatment' | 'other'
const CATEGORY_KEYS: Category[] = ['cleanser','toner','serum','moisturizer','eye_cream','sunscreen','treatment','other']
const CATEGORY_EMOJI: Record<Category, string> = {
  cleanser: '🫧', toner: '💧', serum: '✨', moisturizer: '🥛',
  eye_cream: '👁️', sunscreen: '☀️', treatment: '💊', other: '🧴',
}

export interface CheckinProduct {
  user_product_id: string | null
  brand: string
  name: string
  category: string | null
  is_temporary: boolean
  used_am: boolean
  used_pm: boolean
}

interface RoutineItem {
  routine_id: string
  product_id: string
  brand: string
  name: string
  category: string | null
  routine_type: 'am' | 'pm' | 'both'
  step_order: number
  removed?: boolean // session-only removal
}

interface EditDraft {
  product_id: string
  routine_id: string
  brand: string
  name: string
  category: Category | ''
  routine_type: 'am' | 'pm' | 'both'
}

interface Props {
  onComplete: (products: CheckinProduct[]) => void
  onBack: () => void
}

// Swipeable row wrapper
function SwipeRow({
  children,
  onRemove,
  onEdit,
}: {
  children: React.ReactNode
  onRemove: () => void
  onEdit: () => void
}) {
  const [offset, setOffset] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const startX = useRef(0)
  const THRESHOLD = 70

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setRevealed(false)
    setOffset(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - startX.current
    if (delta < 0) setOffset(Math.max(delta, -120))
  }

  const handleTouchEnd = () => {
    if (offset < -THRESHOLD) {
      setOffset(-110)
      setRevealed(true)
    } else {
      setOffset(0)
      setRevealed(false)
    }
  }

  const handleLongPress = useCallback(() => { onEdit() }, [onEdit])
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startLongPress = () => { longPressTimer.current = setTimeout(handleLongPress, 600) }
  const cancelLongPress = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current) }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Action buttons revealed on swipe */}
      <div className="absolute right-0 top-0 h-full flex items-center gap-1 pr-2">
        <button
          onClick={() => { setOffset(0); setRevealed(false); onEdit() }}
          className="w-10 h-10 bg-amber-400 rounded-lg flex items-center justify-center"
        >
          <Edit2 className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={() => { setOffset(0); setRevealed(false); onRemove() }}
          className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      </div>
      {/* Sliding content */}
      <div
        style={{ transform: `translateX(${offset}px)`, transition: offset === 0 ? 'transform 0.2s ease' : 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchCancel={cancelLongPress}
      >
        {children}
      </div>
    </div>
  )
}

export default function ProductsStep({ onComplete, onBack }: Props) {
  const supabase = createClient()
  const { t } = useLanguage()

  // Build category labels from translations
  const CATEGORY_LABELS = Object.fromEntries(
    CATEGORY_KEYS.map(k => [k, t(`cat_${k}` as never)])
  ) as Record<Category, string>

  const [routine, setRoutine] = useState<RoutineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasRoutine, setHasRoutine] = useState(false)
  const [checked, setChecked] = useState<Record<string, { am: boolean; pm: boolean }>>({})
  const [tempProducts, setTempProducts] = useState<CheckinProduct[]>([])
  const [showTempForm, setShowTempForm] = useState(false)
  const [tempDraft, setTempDraft] = useState({ brand: '', name: '', category: '' as Category | '' })
  const [activeFilter, setActiveFilter] = useState<'all' | 'am' | 'pm'>('all')
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data, error } = await supabase
        .from('user_routines')
        .select(`id, product_id, routine_type, step_order, user_products ( brand, name, category )`)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('routine_type')
        .order('step_order')

      if (!error && data && data.length > 0) {
        const seen = new Map<string, RoutineItem>()
        data.forEach((r: unknown) => {
          const row = r as { id: string; product_id: string; routine_type: string; step_order: number; user_products?: { brand?: string; name?: string; category?: string } }
          const brand = row.user_products?.brand ?? ''
          const name  = row.user_products?.name  ?? ''
          const key   = `${brand}|${name}`
          const rType = row.routine_type as 'am' | 'pm' | 'both'
          if (seen.has(key)) {
            const existing = seen.get(key)!
            if (existing.routine_type !== rType && existing.routine_type !== 'both') {
              existing.routine_type = 'both'
            }
          } else {
            seen.set(key, { routine_id: row.id, product_id: row.product_id, brand, name, category: row.user_products?.category ?? null, routine_type: rType, step_order: row.step_order })
          }
        })
        const items = Array.from(seen.values())
        setRoutine(items)
        setHasRoutine(true)
        const init: Record<string, { am: boolean; pm: boolean }> = {}
        items.forEach(item => {
          init[item.product_id] = {
            am: item.routine_type === 'am' || item.routine_type === 'both',
            pm: item.routine_type === 'pm' || item.routine_type === 'both',
          }
        })
        setChecked(init)
      }
      setLoading(false)
    }
    load()
  }, [])

  // Remove for today's session only (does NOT touch DB)
  const removeForToday = (productId: string) => {
    setRoutine(prev => prev.map(item =>
      item.product_id === productId ? { ...item, removed: true } : item
    ))
    setChecked(prev => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  const toggle = (productId: string, session: 'am' | 'pm') => {
    setChecked(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [session]: !prev[productId]?.[session] },
    }))
  }

  // Save permanent edit to DB
  const handleSaveEdit = async () => {
    if (!editDraft) return
    setSaving(true)
    await supabase.from('user_products').update({
      brand: editDraft.brand,
      name: editDraft.name,
      category: editDraft.category || null,
    }).eq('id', editDraft.product_id)

    // Update routine_type: remove old entries, add new ones
    await supabase.from('user_routines').update({ is_active: false }).eq('product_id', editDraft.product_id)
    const types = editDraft.routine_type === 'both' ? ['am', 'pm'] : [editDraft.routine_type]
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('user_routines').insert(
        types.map((rt, i) => ({ user_id: user.id, product_id: editDraft.product_id, routine_type: rt, step_order: i, is_active: true }))
      )
    }
    // Update local state
    setRoutine(prev => prev.map(item =>
      item.product_id === editDraft.product_id
        ? { ...item, brand: editDraft.brand, name: editDraft.name, category: editDraft.category || null, routine_type: editDraft.routine_type }
        : item
    ))
    setSaving(false)
    setEditDraft(null)
  }

  const openEdit = (item: RoutineItem) => {
    setEditDraft({
      product_id: item.product_id,
      routine_id: item.routine_id,
      brand: item.brand,
      name: item.name,
      category: (item.category as Category) || '',
      routine_type: item.routine_type,
    })
  }

  const addTempProduct = () => {
    if (!tempDraft.brand.trim() || !tempDraft.name.trim()) return
    setTempProducts(prev => [...prev, {
      user_product_id: null, brand: tempDraft.brand.trim(), name: tempDraft.name.trim(),
      category: tempDraft.category || null, is_temporary: true, used_am: true, used_pm: false,
    }])
    setTempDraft({ brand: '', name: '', category: '' })
    setShowTempForm(false)
  }

  const handleSubmit = () => {
    const routineProducts: CheckinProduct[] = routine
      .filter(item => !item.removed && (checked[item.product_id]?.am || checked[item.product_id]?.pm))
      .map(item => ({
        user_product_id: item.product_id, brand: item.brand, name: item.name, category: item.category,
        is_temporary: false, used_am: checked[item.product_id]?.am ?? false, used_pm: checked[item.product_id]?.pm ?? false,
      }))
    onComplete([...routineProducts, ...tempProducts])
  }

  const visibleRoutine = routine.filter(item => {
    if (item.removed) return false
    if (activeFilter === 'all') return true
    return item.routine_type === activeFilter || item.routine_type === 'both'
  })

  // Task 2: unique count by brand+name
  const checkedCount = (() => {
    const seen = new Set<string>()
    let count = 0
    for (const item of routine) {
      if (item.removed) continue
      if (checked[item.product_id]?.am || checked[item.product_id]?.pm) {
        const key = `${item.brand}|${item.name}`
        if (!seen.has(key)) { seen.add(key); count++ }
      }
    }
    count += tempProducts.length
    return count
  })()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-rose-300" />
        <p className="text-sm text-stone-400">{t('products_loading')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">{t('products_title')}</h2>
        <p className="text-sm text-stone-500 mt-0.5">
          {hasRoutine ? t('products_subtitle') : t('products_subtitle_no_routine')}
        </p>
      </div>

      {!hasRoutine && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm font-medium text-amber-700">{t('products_no_routine_title')}</p>
            <p className="text-xs text-amber-600 mt-0.5">{t('products_no_routine_body')}</p>
            <a href="/routine/setup" className="text-xs text-amber-700 underline mt-1 inline-block">{t('products_setup_routine')}</a>
          </div>
        </div>
      )}

      {hasRoutine && (
        <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
          {(['all', 'am', 'pm'] as const).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${activeFilter === f ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}>
              {f === 'all' ? t('products_filter_all') : f === 'am' ? t('products_filter_am') : t('products_filter_pm')}
            </button>
          ))}
        </div>
      )}

      {visibleRoutine.length > 0 && (
        <div className="space-y-2">
          {visibleRoutine.map(item => {
            const isAmChecked = checked[item.product_id]?.am ?? false
            const isPmChecked = checked[item.product_id]?.pm ?? false
            const anyChecked  = isAmChecked || isPmChecked
            const emoji = item.category ? CATEGORY_EMOJI[item.category as Category] : '🧴'
            return (
              <SwipeRow
                key={item.product_id}
                onRemove={() => removeForToday(item.product_id)}
                onEdit={() => openEdit(item)}
              >
                <div className={`bg-white rounded-xl p-3 border transition-all ${anyChecked ? 'border-rose-200' : 'border-stone-100 opacity-50'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl flex-shrink-0">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-stone-400">{item.brand}</span>
                        <span className="text-sm font-medium text-stone-800 truncate">{item.name}</span>
                      </div>
                      {item.category && (
                        <span className="text-xs text-stone-400">
                          {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => toggle(item.product_id, 'am')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${isAmChecked ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-400'}`}>
                        <Sun className="w-3 h-3" /> AM
                      </button>
                      <button onClick={() => toggle(item.product_id, 'pm')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${isPmChecked ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-100 text-stone-400'}`}>
                        <Moon className="w-3 h-3" /> PM
                      </button>
                    </div>
                  </div>
                </div>
              </SwipeRow>
            )
          })}
        </div>
      )}

      {tempProducts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">{t('products_extra_used')}</p>
          {tempProducts.map((p, i) => (
            <div key={i} className="bg-violet-50 rounded-xl p-3 border border-violet-100 flex items-center gap-3">
              <span className="text-xl">🆕</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-violet-400">{p.brand}</span>
                  <span className="text-sm font-medium text-stone-800 truncate">{p.name}</span>
                </div>
              </div>
              <button onClick={() => setTempProducts(prev => prev.filter((_, j) => j !== i))} className="text-violet-300 hover:text-rose-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showTempForm ? (
        <div className="bg-white rounded-xl p-4 border border-violet-200 space-y-3">
          <p className="text-sm font-medium text-stone-700">{t('products_temp_title')}</p>
          <input type="text" placeholder={t('products_brand')} value={tempDraft.brand}
            onChange={e => setTempDraft(d => ({ ...d, brand: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-violet-300" autoFocus />
          <input type="text" placeholder={t('products_name')} value={tempDraft.name}
            onChange={e => setTempDraft(d => ({ ...d, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-violet-300" />
          <select value={tempDraft.category}
            onChange={e => setTempDraft(d => ({ ...d, category: e.target.value as Category }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-violet-300 text-stone-600">
            <option value="">{t('products_category')}</option>
            {(Object.keys(CATEGORY_LABELS) as Category[]).map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={() => { setShowTempForm(false); setTempDraft({ brand: '', name: '', category: '' }) }}
              className="flex-1 py-2 text-sm text-stone-500 border border-stone-200 rounded-lg">{t('products_cancel')}</button>
            <button onClick={addTempProduct} disabled={!tempDraft.brand.trim() || !tempDraft.name.trim()}
              className="flex-1 py-2 text-sm font-medium bg-violet-400 text-white rounded-lg disabled:opacity-40">{t('products_add')}</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowTempForm(true)}
          className="w-full py-2.5 border-2 border-dashed border-stone-200 rounded-xl text-sm text-stone-400 flex items-center justify-center gap-2 hover:border-violet-300 hover:text-violet-400 transition-colors">
          <Plus className="w-4 h-4" />{t('products_add_temp')}
        </button>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-medium text-stone-600">{t('products_back')}</button>
        <button onClick={handleSubmit}
          className="flex-1 py-3 bg-rose-400 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          {checkedCount > 0 ? (
            <><CheckCircle2 className="w-4 h-4" />{t('products_confirm', { count: checkedCount })}</>
          ) : t('products_skip')}
        </button>
      </div>

      {/* Edit product bottom sheet */}
      {editDraft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditDraft(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl px-5 pt-5 pb-8 space-y-4 animate-slide-up">
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-800">Edit product</h3>
              <button onClick={() => setEditDraft(null)}><X className="w-4 h-4 text-stone-400" /></button>
            </div>
            <input type="text" placeholder="Brand" value={editDraft.brand}
              onChange={e => setEditDraft(d => d ? { ...d, brand: e.target.value } : d)}
              className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-rose-300" />
            <input type="text" placeholder="Product name" value={editDraft.name}
              onChange={e => setEditDraft(d => d ? { ...d, name: e.target.value } : d)}
              className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-rose-300" />
            <select value={editDraft.category}
              onChange={e => setEditDraft(d => d ? { ...d, category: e.target.value as Category } : d)}
              className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-rose-300 text-stone-700">
              <option value="">Category (optional)</option>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <div className="flex gap-2">
              {(['am', 'pm', 'both'] as const).map(rt => (
                <button key={rt} onClick={() => setEditDraft(d => d ? { ...d, routine_type: rt } : d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${editDraft.routine_type === rt ? 'bg-rose-400 text-white border-rose-400' : 'bg-white text-stone-600 border-stone-200'}`}>
                  {rt === 'am' ? '☀️ AM' : rt === 'pm' ? '🌙 PM' : '🔄 Both'}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditDraft(null)}
                className="flex-1 py-3 border border-stone-200 rounded-xl text-sm text-stone-600">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving || !editDraft.name.trim()}
                className="flex-1 py-3 bg-rose-400 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
