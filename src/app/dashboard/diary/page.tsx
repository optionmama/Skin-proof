'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, BookOpen, Star, Search, Filter, Package } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { UserProductLog } from '@/types/database'

const REACTION_CONFIG = {
  positive: { label: '✓ Positive', bg: 'bg-sage-100', text: 'text-sage-700' },
  neutral: { label: '○ Neutral', bg: 'bg-skin-100', text: 'text-skin-600' },
  negative: { label: '✗ Negative', bg: 'bg-red-100', text: 'text-red-600' },
  allergic: { label: '⚠ Allergic', bg: 'bg-amber-100', text: 'text-amber-700' },
}

export default function DiaryPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<UserProductLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'current' | 'past'>('current')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [filter])

  const loadLogs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('user_product_logs')
      .select('*, product:products(name, brand, category, image_url, fragrance_free, cruelty_free)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (filter === 'current') query = query.eq('is_current', true)
    if (filter === 'past') query = query.eq('is_current', false)

    const { data } = await query
    setLogs(data || [])
    setLoading(false)
  }

  const filtered = logs.filter(log =>
    !search ||
    log.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    log.product?.brand?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-3xl font-light text-charcoal-900">Product Diary</h1>
          <p className="text-charcoal-500 text-sm font-body">{logs.length} products logged</p>
        </div>
        <Link
          href="/dashboard/diary/add"
          className="w-10 h-10 rounded-xl bg-skin-500 flex items-center justify-center text-white hover:bg-skin-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 font-body text-sm"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-skin-100 rounded-xl p-1 mb-5">
        {(['all', 'current', 'past'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
              filter === f ? 'bg-white text-charcoal-900 shadow-sm' : 'text-charcoal-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Products list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
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
            {search ? 'Try a different search term.' : 'Start logging the products in your routine.'}
          </p>
          {!search && (
            <Link
              href="/dashboard/diary/add"
              className="inline-flex items-center gap-2 bg-skin-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-skin-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add first product
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(log => {
            const reaction = log.skin_reaction ? REACTION_CONFIG[log.skin_reaction] : null
            return (
              <Link
                key={log.id}
                href={`/dashboard/diary/${log.id}`}
                className="block bg-white rounded-2xl border border-skin-100 p-4 hover:border-skin-200 hover:shadow-sm transition-all active:scale-[0.98]"
              >
                <div className="flex gap-3">
                  {/* Product image or placeholder */}
                  <div className="w-14 h-14 rounded-xl bg-skin-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {log.product?.image_url ? (
                      <img src={log.product.image_url} alt={log.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-skin-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-charcoal-900 text-sm leading-tight truncate">{log.product?.name}</p>
                      {!log.is_current && (
                        <span className="text-xs text-charcoal-400 shrink-0 font-body">past</span>
                      )}
                    </div>
                    <p className="text-xs text-charcoal-500 mb-2">{log.product?.brand}</p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Category tag */}
                      <span className="text-xs bg-skin-50 text-skin-600 border border-skin-200 px-2 py-0.5 rounded-full capitalize">
                        {log.product?.category?.replace(/_/g, ' ')}
                      </span>

                      {/* Reaction */}
                      {reaction && (
                        <span className={`text-xs ${reaction.bg} ${reaction.text} px-2 py-0.5 rounded-full font-medium`}>
                          {reaction.label}
                        </span>
                      )}

                      {/* Rating */}
                      {log.user_rating && (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= log.user_rating! ? 'fill-cream-400 text-cream-400' : 'text-charcoal-200'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Usage dates */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-skin-50">
                  <div className="flex gap-3 text-xs text-charcoal-400 font-body">
                    {log.started_using && <span>Started {formatDate(log.started_using)}</span>}
                    {log.usage_frequency && (
                      <span className="capitalize">{log.usage_frequency.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {log.product?.fragrance_free && (
                      <span className="text-xs bg-sage-50 text-sage-600 px-1.5 py-0.5 rounded">FF</span>
                    )}
                    {log.product?.cruelty_free && (
                      <span className="text-xs bg-sage-50 text-sage-600 px-1.5 py-0.5 rounded">CF</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
