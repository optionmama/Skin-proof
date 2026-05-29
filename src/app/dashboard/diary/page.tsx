'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, BookOpen, Search, Package } from 'lucide-react'

type RoutineType = 'am' | 'pm' | 'both'

interface RoutineProduct {
  routine_id: string
  product_id: string
  routine_type: RoutineType
  step_order: number
  brand: string
  name: string
  category: string | null
  daysInRoutine?: number
  scoreDelta?: number | null
}

const BENEFICIAL = ['niacinamide', 'hyaluronic acid', 'ceramide', 'centella', 'vitamin c', 'retinol', 'peptide']
const IRRITANTS   = ['fragrance', 'parfum', 'alcohol denat', 'sodium lauryl sulfate']

const ROUTINE_LABEL: Record<RoutineType, string> = { am: 'AM', pm: 'PM', both: 'AM & PM' }
const ROUTINE_COLOR: Record<RoutineType, string> = {
  am:   'bg-amber-50 text-amber-700',
  pm:   'bg-indigo-50 text-indigo-700',
  both: 'bg-sage-50 text-sage-700',
}

export default function DiaryPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<RoutineProduct[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<'all' | 'am' | 'pm'>('all')

  useEffect(() => { loadProducts() }, [])

  const loadProducts = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Step 1: load user_routines
    const { data: routines } = await supabase
      .from('user_routines')
      .select('id, product_id, routine_type, step_order')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('routine_type')
      .order('step_order')

    if (!routines || routines.length === 0) { setProducts([]); setLoading(false); return }

    // Step 2: load user_products for those ids
    const productIds = [...new Set(routines.map((r: { product_id: string }) => r.product_id))]
    const { data: userProducts } = await supabase
      .from('user_products')
      .select('id, brand, name, category, created_at')
      .in('id', productIds)

    const productMap = new Map((userProducts ?? []).map((p: { id: string; brand: string; name: string; category: string | null; created_at: string }) => [p.id, p]))

    // Step 3: load skin photo scores for delta calculation
    const { data: photoScores } = await supabase
      .from('skin_photos')
      .select('overall_skin_score, created_at')
      .eq('user_id', user.id)
      .not('overall_skin_score', 'is', null)
      .order('created_at', { ascending: true })

    const scores = photoScores ?? []

    const today = new Date()

    // Deduplicate by brand+name — handles duplicate product_id entries from setup
    const seen = new Map<string, RoutineProduct>()
    for (const r of routines as { id: string; product_id: string; routine_type: string; step_order: number }[]) {
      const p = productMap.get(r.product_id)
      const addedAt = p?.created_at ? new Date(p.created_at) : null
      const daysInRoutine = addedAt
        ? Math.floor((today.getTime() - addedAt.getTime()) / 86400000)
        : 0

      let scoreDelta: number | null = null
      if (daysInRoutine >= 14 && addedAt) {
        const prior  = scores.filter(s => new Date(s.created_at) < addedAt)
        const during = scores.filter(s => new Date(s.created_at) >= addedAt)
        const avg = (arr: typeof scores) => arr.length ? arr.reduce((s, ph) => s + Number(ph.overall_skin_score), 0) / arr.length : null
        const pa = avg(prior), da = avg(during)
        if (pa !== null && da !== null) scoreDelta = Math.round((da - pa) * 10) / 10
      }

      const rType = r.routine_type as RoutineType
      const dedupeKey = `${(p?.brand || '').toLowerCase()}|${(p?.name || '').toLowerCase()}`
      if (seen.has(dedupeKey)) {
        const existing = seen.get(dedupeKey)!
        if (existing.routine_type !== rType && existing.routine_type !== 'both') {
          existing.routine_type = 'both'
        }
      } else {
        seen.set(dedupeKey, {
          routine_id:   r.id,
          product_id:   r.product_id,
          routine_type: rType,
          step_order:   r.step_order,
          brand:        p?.brand ?? '',
          name:         p?.name  ?? '—',
          category:     p?.category ?? null,
          daysInRoutine,
          scoreDelta:   daysInRoutine >= 14 ? scoreDelta : undefined,
        })
      }
    }

    setProducts(Array.from(seen.values()))
    setLoading(false)
  }

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.routine_type === filter || p.routine_type === 'both'
    return matchSearch && matchFilter
  })

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="font-display text-3xl font-light text-charcoal-900">Product Diary</h1>
          <p className="text-charcoal-500 text-sm font-body">
            Track what you use — so we can learn what&apos;s helping 📖
          </p>
        </div>
        <Link href="/dashboard/diary/add"
          className="w-10 h-10 rounded-xl bg-skin-500 flex items-center justify-center text-white hover:bg-skin-600 transition-colors">
          <Plus className="w-5 h-5" />
        </Link>
      </div>
      <p className="text-xs text-charcoal-400 font-body mb-4">{products.length} product{products.length !== 1 ? 's' : ''} in routine</p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
        <input type="text" placeholder="Search products…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 font-body text-sm" />
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-skin-100 rounded-xl p-1 mb-5">
        {(['all', 'am', 'pm'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === f ? 'bg-white text-charcoal-900 shadow-sm' : 'text-charcoal-500'
            }`}>
            {f === 'all' ? 'All' : f === 'am' ? '☀️ AM' : '🌙 PM'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-skin-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-skin-400" />
          </div>
          <h3 className="font-display text-xl font-light text-charcoal-800 mb-2">
            {search ? 'No matches' : 'No products yet'}
          </h3>
          <p className="text-charcoal-500 text-sm font-body mb-5">
            {search
              ? 'Try a different search term.'
              : "Add your first product — we'll track if it's working 💧"}
          </p>
          {!search && (
            <Link href="/dashboard/diary/add"
              className="inline-flex items-center gap-2 bg-skin-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-skin-600 transition-colors">
              <Plus className="w-4 h-4" /> Add first product
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(product => (
            <div key={product.routine_id}>
              {/* Product card */}
              <div className="bg-white rounded-2xl border border-skin-100 p-4">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-skin-100 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-skin-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-charcoal-900 text-sm leading-tight">{product.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ROUTINE_COLOR[product.routine_type]}`}>
                        {ROUTINE_LABEL[product.routine_type]}
                      </span>
                    </div>
                    {product.brand && <p className="text-xs text-charcoal-500 mb-1">{product.brand}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      {product.category && (
                        <span className="text-xs bg-skin-50 text-skin-600 border border-skin-200 px-2 py-0.5 rounded-full capitalize">
                          {product.category}
                        </span>
                      )}
                      {(product.daysInRoutine ?? 0) > 0 && (
                        <span className="text-xs text-charcoal-400 font-body">
                          {product.daysInRoutine}d in routine
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 14-day insight row */}
              {product.scoreDelta !== undefined && (
                <div className="bg-sage-50 border border-t-0 border-sage-200 rounded-b-2xl -mt-1 px-4 py-3">
                  <p className="text-xs text-sage-800 font-body flex items-start gap-1.5">
                    <span className="shrink-0">📊</span>
                    <span>
                      <strong>{product.daysInRoutine} days</strong> using {product.name}.{' '}
                      {product.scoreDelta !== null
                        ? product.scoreDelta > 0
                          ? <span>Skin score improved by <strong className="text-sage-700">+{product.scoreDelta} pts</strong> ✓</span>
                          : product.scoreDelta < 0
                            ? <span>Skin score changed by <strong className="text-amber-700">{product.scoreDelta} pts</strong>.</span>
                            : <span>No significant score change yet.</span>
                        : <span className="text-charcoal-400">Tracking in progress…</span>
                      }
                    </span>
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Manage routine link */}
          <Link href="/routine/setup"
            className="block text-center text-xs text-skin-600 font-medium py-3 hover:text-skin-700">
            Manage routine in full →
          </Link>
        </div>
      )}
    </div>
  )
}
