'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Plus, X, Loader2, Sun, Moon } from 'lucide-react'
import { t } from '@/lib/i18n'

type Category =
  | 'cleanser' | 'toner' | 'serum' | 'moisturizer'
  | 'eye_cream' | 'sunscreen' | 'treatment' | 'other'

const CATEGORY_LABELS = t.products.categories

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
}

interface Props {
  onComplete: (products: CheckinProduct[]) => void
  onBack: () => void
}

export default function ProductsStep({ onComplete, onBack }: Props) {
  const supabase = createClient()
  const [routine, setRoutine] = useState<RoutineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasRoutine, setHasRoutine] = useState(false)
  const [checked, setChecked] = useState<Record<string, { am: boolean; pm: boolean }>>({})
  const [tempProducts, setTempProducts] = useState<CheckinProduct[]>([])
  const [showTempForm, setShowTempForm] = useState(false)
  const [tempDraft, setTempDraft] = useState({ brand: '', name: '', category: '' as Category | '' })
  const [activeFilter, setActiveFilter] = useState<'all' | 'am' | 'pm'>('all')

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
            seen.set(key, {
              routine_id: row.id,
              product_id: row.product_id,
              brand,
              name,
              category: row.user_products?.category ?? null,
              routine_type: rType,
              step_order: row.step_order,
            })
          }
        })

        const items: RoutineItem[] = Array.from(seen.values())
        setRoutine(items)
        setHasRoutine(true)

        const initialChecked: Record<string, { am: boolean; pm: boolean }> = {}
        items.forEach(item => {
          initialChecked[item.product_id] = {
            am: item.routine_type === 'am' || item.routine_type === 'both',
            pm: item.routine_type === 'pm' || item.routine_type === 'both',
          }
        })
        setChecked(initialChecked)
      }
      setLoading(false)
    }
    load()
  }, [])

  const toggle = (productId: string, session: 'am' | 'pm') => {
    setChecked(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [session]: !prev[productId]?.[session] },
    }))
  }

  const addTempProduct = () => {
    if (!tempDraft.brand.trim() || !tempDraft.name.trim()) return
    setTempProducts(prev => [...prev, {
      user_product_id: null,
      brand: tempDraft.brand.trim(),
      name: tempDraft.name.trim(),
      category: tempDraft.category || null,
      is_temporary: true,
      used_am: true,
      used_pm: false,
    }])
    setTempDraft({ brand: '', name: '', category: '' })
    setShowTempForm(false)
  }

  const removeTempProduct = (index: number) => {
    setTempProducts(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const routineProducts: CheckinProduct[] = routine
      .filter(item => checked[item.product_id]?.am || checked[item.product_id]?.pm)
      .map(item => ({
        user_product_id: item.product_id,
        brand: item.brand,
        name: item.name,
        category: item.category,
        is_temporary: false,
        used_am: checked[item.product_id]?.am ?? false,
        used_pm: checked[item.product_id]?.pm ?? false,
      }))
    onComplete([...routineProducts, ...tempProducts])
  }

  const filteredRoutine = routine.filter(item => {
    if (activeFilter === 'all') return true
    return item.routine_type === activeFilter || item.routine_type === 'both'
  })

  const checkedCount = Object.values(checked).filter(v => v.am || v.pm).length + tempProducts.length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-rose-300" />
        <p className="text-sm text-stone-400">{t.products.loading}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">{t.products.title}</h2>
        <p className="text-sm text-stone-500 mt-0.5">
          {hasRoutine ? t.products.subtitle_with_routine : t.products.subtitle_no_routine}
        </p>
      </div>

      {!hasRoutine && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm font-medium text-amber-700">{t.products.no_routine_title}</p>
            <p className="text-xs text-amber-600 mt-0.5">{t.products.no_routine_body}</p>
            <a href="/routine/setup" className="text-xs text-amber-700 underline mt-1 inline-block">
              {t.products.setup_routine}
            </a>
          </div>
        </div>
      )}

      {hasRoutine && (
        <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
          {(['all', 'am', 'pm'] as const).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeFilter === f ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'
              }`}>
              {f === 'all' ? t.products.filter_all : f === 'am' ? t.products.filter_am : t.products.filter_pm}
            </button>
          ))}
        </div>
      )}

      {filteredRoutine.length > 0 && (
        <div className="space-y-2">
          {filteredRoutine.map(item => {
            const isAmChecked = checked[item.product_id]?.am ?? false
            const isPmChecked = checked[item.product_id]?.pm ?? false
            const anyChecked = isAmChecked || isPmChecked
            const emoji = item.category ? CATEGORY_EMOJI[item.category as Category] : '🧴'
            return (
              <div key={item.product_id}
                className={`bg-white rounded-xl p-3 border transition-all ${anyChecked ? 'border-rose-200' : 'border-stone-100 opacity-50'}`}>
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
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                        isAmChecked ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-400'
                      }`}>
                      <Sun className="w-3 h-3" /> AM
                    </button>
                    <button onClick={() => toggle(item.product_id, 'pm')}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                        isPmChecked ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-100 text-stone-400'
                      }`}>
                      <Moon className="w-3 h-3" /> PM
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tempProducts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">{t.products.extra_used}</p>
          {tempProducts.map((p, i) => (
            <div key={i} className="bg-violet-50 rounded-xl p-3 border border-violet-100 flex items-center gap-3">
              <span className="text-xl">🆕</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-violet-400">{p.brand}</span>
                  <span className="text-sm font-medium text-stone-800 truncate">{p.name}</span>
                </div>
              </div>
              <button onClick={() => removeTempProduct(i)} className="text-violet-300 hover:text-rose-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showTempForm ? (
        <div className="bg-white rounded-xl p-4 border border-violet-200 space-y-3">
          <p className="text-sm font-medium text-stone-700">{t.products.temp_form_title}</p>
          <input type="text" placeholder={t.products.brand_placeholder} value={tempDraft.brand}
            onChange={e => setTempDraft(d => ({ ...d, brand: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-violet-300" autoFocus />
          <input type="text" placeholder={t.products.name_placeholder} value={tempDraft.name}
            onChange={e => setTempDraft(d => ({ ...d, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-violet-300" />
          <select value={tempDraft.category}
            onChange={e => setTempDraft(d => ({ ...d, category: e.target.value as Category }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-violet-300 text-stone-600">
            <option value="">{t.products.category_placeholder}</option>
            {(Object.keys(CATEGORY_LABELS) as Category[]).map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={() => { setShowTempForm(false); setTempDraft({ brand: '', name: '', category: '' }) }}
              className="flex-1 py-2 text-sm text-stone-500 border border-stone-200 rounded-lg">
              {t.products.cancel}
            </button>
            <button onClick={addTempProduct} disabled={!tempDraft.brand.trim() || !tempDraft.name.trim()}
              className="flex-1 py-2 text-sm font-medium bg-violet-400 text-white rounded-lg disabled:opacity-40">
              {t.products.add}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowTempForm(true)}
          className="w-full py-2.5 border-2 border-dashed border-stone-200 rounded-xl text-sm text-stone-400 flex items-center justify-center gap-2 hover:border-violet-300 hover:text-violet-400 transition-colors">
          <Plus className="w-4 h-4" />
          {t.products.add_temp}
        </button>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack}
          className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-medium text-stone-600">
          {t.products.back}
        </button>
        <button onClick={handleSubmit}
          className="flex-1 py-3 bg-rose-400 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          {checkedCount > 0 ? (
            <><CheckCircle2 className="w-4 h-4" />{t.products.confirm(checkedCount)}</>
          ) : t.products.skip}
        </button>
      </div>
    </div>
  )
}
