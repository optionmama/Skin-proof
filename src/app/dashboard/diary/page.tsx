'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, BookOpen, Star, Search, Package } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { UserProductLog } from '@/types/database'

const REACTION_CONFIG = {
  positive: { label: '✓ Positive', bg: 'bg-sage-100', text: 'text-sage-700' },
  neutral:  { label: '○ Neutral',  bg: 'bg-skin-100', text: 'text-skin-600' },
  negative: { label: '✗ Negative', bg: 'bg-red-100',  text: 'text-red-600'  },
  allergic: { label: '⚠ Allergic', bg: 'bg-amber-100',text: 'text-amber-700'},
}

const BENEFICIAL = ['niacinamide', 'hyaluronic acid', 'ceramide', 'centella', 'vitamin c', 'retinol', 'peptide']
const IRRITANTS   = ['fragrance', 'parfum', 'alcohol denat', 'sodium lauryl sulfate']

interface LogWithInsight extends UserProductLog {
  daysUsed?: number
  scoreDelta?: number | null
  beneficialFlags?: string[]
  cautionFlags?: string[]
}

export default function DiaryPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<LogWithInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'current' | 'past'>('current')

  useEffect(() => { loadLogs() }, [filter])

  const loadLogs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('user_product_logs')
      .select(`
        *,
        product:products(
          name, brand, category, image_url, fragrance_free, cruelty_free,
          product_ingredients(ingredient_name)
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (filter === 'current') query = query.eq('is_current', true)
    if (filter === 'past')    query = query.eq('is_current', false)

    const { data: rawLogs } = await query
    if (!rawLogs) { setLogs([]); setLoading(false); return }

    const today = new Date()
    const qualifying = rawLogs.filter(l => {
      if (!l.started_using) return false
      return Math.floor((today.getTime() - new Date(l.started_using).getTime()) / 86400000) >= 14
    })

    let photoScores: { overall_skin_score: number; created_at: string }[] = []
    if (qualifying.length > 0) {
      const earliest = qualifying.map(l => l.started_using!).sort()[0]
      const cutoff = new Date(new Date(earliest).getTime() - 14 * 86400000).toISOString()
      const { data } = await supabase
        .from('skin_photos')
        .select('overall_skin_score, created_at')
        .eq('user_id', user.id)
        .not('overall_skin_score', 'is', null)
        .gte('created_at', cutoff)
      photoScores = data || []
    }

    const enriched: LogWithInsight[] = rawLogs.map(log => {
      const p = log.product as (typeof log.product & { product_ingredients?: { ingredient_name: string }[] }) | null
      const ings = p?.product_ingredients?.map(i => i.ingredient_name.toLowerCase()) || []
      const daysUsed = log.started_using
        ? Math.floor((today.getTime() - new Date(log.started_using).getTime()) / 86400000)
        : 0

      let scoreDelta: number | null = null
      if (daysUsed >= 14 && log.started_using) {
        const start = new Date(log.started_using)
        const prior = photoScores.filter(p => new Date(p.created_at) < start &&
          new Date(p.created_at) >= new Date(start.getTime() - 14 * 86400000))
        const during = photoScores.filter(p => new Date(p.created_at) >= start)
        const avg = (arr: typeof prior) => arr.length ? arr.reduce((s, p) => s + p.overall_skin_score, 0) / arr.length : null
        const pa = avg(prior), da = avg(during)
        if (pa !== null && da !== null) scoreDelta = Math.round((da - pa) * 10) / 10
      }

      return {
        ...log,
        daysUsed,
        scoreDelta: daysUsed >= 14 ? scoreDelta : undefined,
        beneficialFlags: BENEFICIAL.filter(b => ings.some(i => i.includes(b))),
        cautionFlags:    IRRITANTS.filter(c => ings.some(i => i.includes(c))),
      }
    })

    setLogs(enriched)
    setLoading(false)
  }

  const filtered = logs.filter(log =>
    !search ||
    (log.product as { name?: string } | null)?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (log.product as { brand?: string } | null)?.brand?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="font-display text-3xl font-light text-charcoal-900">Product Diary</h1>
          <p className="text-charcoal-500 text-sm font-body">
            記錄你用的每樣產品，讓我們找出什麼真的有效 📖
          </p>
        </div>
        <Link href="/dashboard/diary/add"
          className="w-10 h-10 rounded-xl bg-skin-500 flex items-center justify-center text-white hover:bg-skin-600 transition-colors">
          <Plus className="w-5 h-5" />
        </Link>
      </div>
      <p className="text-xs text-charcoal-400 font-body mb-4">{logs.length} products logged</p>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
        <input type="text" placeholder="Search products…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 font-body text-sm" />
      </div>

      <div className="flex gap-1 bg-skin-100 rounded-xl p-1 mb-5">
        {(['all', 'current', 'past'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
              filter === f ? 'bg-white text-charcoal-900 shadow-sm' : 'text-charcoal-500'
            }`}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
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
            {search ? 'Try a different search term.'
              : '還沒有產品紀錄。加入你現在用的產品，14 天後我會告訴你它到底有沒有效 💪'}
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
          {filtered.map(log => {
            const reaction = log.skin_reaction ? REACTION_CONFIG[log.skin_reaction as keyof typeof REACTION_CONFIG] : null
            const product = log.product as { name?: string; brand?: string; category?: string; image_url?: string; fragrance_free?: boolean; cruelty_free?: boolean } | null

            return (
              <div key={log.id}>
                <Link href={`/dashboard/diary/${log.id}`}
                  className="block bg-white rounded-2xl border border-skin-100 p-4 hover:border-skin-200 hover:shadow-sm transition-all active:scale-[0.98]">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-xl bg-skin-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {product?.image_url
                        ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        : <Package className="w-6 h-6 text-skin-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-charcoal-900 text-sm leading-tight truncate">{product?.name}</p>
                        {!log.is_current && <span className="text-xs text-charcoal-400 shrink-0 font-body">past</span>}
                      </div>
                      <p className="text-xs text-charcoal-500 mb-2">{product?.brand}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-skin-50 text-skin-600 border border-skin-200 px-2 py-0.5 rounded-full capitalize">
                          {product?.category?.replace(/_/g, ' ')}
                        </span>
                        {reaction && (
                          <span className={`text-xs ${reaction.bg} ${reaction.text} px-2 py-0.5 rounded-full font-medium`}>
                            {reaction.label}
                          </span>
                        )}
                        {log.user_rating && (
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3 h-3 ${s <= log.user_rating! ? 'fill-cream-400 text-cream-400' : 'text-charcoal-200'}`} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-skin-50">
                    <div className="flex gap-3 text-xs text-charcoal-400 font-body">
                      {log.started_using && <span>Started {formatDate(log.started_using)}</span>}
                      {log.usage_frequency && <span className="capitalize">{log.usage_frequency.replace(/_/g, ' ')}</span>}
                    </div>
                    <div className="flex gap-1">
                      {product?.fragrance_free && <span className="text-xs bg-sage-50 text-sage-600 px-1.5 py-0.5 rounded">FF</span>}
                      {product?.cruelty_free    && <span className="text-xs bg-sage-50 text-sage-600 px-1.5 py-0.5 rounded">CF</span>}
                    </div>
                  </div>
                </Link>

                {/* 14-day insight row */}
                {log.daysUsed !== undefined && log.daysUsed >= 14 && (
                  <div className="bg-sage-50 border border-t-0 border-sage-200 rounded-b-2xl px-4 py-3">
                    <div className="flex items-start gap-2 text-xs text-sage-800 font-body">
                      <span className="shrink-0">📊</span>
                      <div className="space-y-1">
                        <p>
                          <strong>{log.daysUsed} days</strong> using {product?.name}.
                          {log.scoreDelta !== null && log.scoreDelta !== undefined
                            ? log.scoreDelta > 0
                              ? <span className="text-sage-700"> Skin score improved by <strong>+{log.scoreDelta} pts</strong> ✓</span>
                              : log.scoreDelta < 0
                                ? <span className="text-amber-700"> Skin score changed by <strong>{log.scoreDelta} pts</strong>.</span>
                                : <span className="text-charcoal-500"> No significant score change yet.</span>
                            : <span className="text-charcoal-400"> Tracking in progress…</span>
                          }
                        </p>
                        {((log.beneficialFlags?.length ?? 0) > 0 || (log.cautionFlags?.length ?? 0) > 0) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {log.beneficialFlags?.map(f => (
                              <span key={f} className="bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full capitalize">{f} ✓</span>
                            ))}
                            {log.cautionFlags?.map(f => (
                              <span key={f} className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full capitalize">{f} ⚠️</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
