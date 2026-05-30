'use client'

import { useState, useEffect } from 'react'
import { Users, Package, ShoppingCart } from 'lucide-react'
import type { CommunityProduct } from '@/app/api/community-picks/route'

interface TierData {
  products: CommunityProduct[]
  userCount: number
  threshold: number
  skinType: string | null
}

function ProductCard({ product, region }: { product: CommunityProduct; region?: string }) {
  const GOOGLE_DOMAINS: Record<string, string> = {
    Asia: 'https://www.google.com.tw/search',
    Americas: 'https://www.google.com/search',
    Europe: 'https://www.google.co.uk/search',
    Australia: 'https://www.google.com.au/search',
    Global: 'https://www.google.com/search',
  }
  const domain = GOOGLE_DOMAINS[region || 'Global'] || GOOGLE_DOMAINS['Global']
  const shoppingUrl = `${domain}?q=${encodeURIComponent(`${product.brand} ${product.name}`)}&tbm=shop`

  return (
    <div className="bg-white rounded-xl border border-skin-100 p-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-skin-50 flex items-center justify-center shrink-0">
          <Package className="w-4 h-4 text-skin-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-charcoal-900 leading-tight">{product.name}</p>
          {product.brand && <p className="text-xs text-charcoal-500 mt-0.5">{product.brand}</p>}
          {product.category && (
            <span className="inline-block mt-1 text-xs bg-skin-50 text-skin-600 border border-skin-200 px-2 py-0.5 rounded-full capitalize">
              {product.category}
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-semibold text-charcoal-800">{product.user_count}</p>
          <p className="text-xs text-charcoal-400">user{product.user_count !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <a
        href={shoppingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 w-full flex items-center justify-center gap-1.5 border border-skin-200 text-skin-700 py-2 rounded-lg text-xs font-medium hover:bg-skin-50 transition-colors"
      >
        <ShoppingCart className="w-3 h-3" />
        Find on Google Shopping ↗
      </a>
    </div>
  )
}

function Tier({
  threshold,
  label,
  badge,
  region,
}: {
  threshold: 75 | 80
  label: string
  badge: string
  region?: string
}) {
  const [data, setData] = useState<TierData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/community-picks?threshold=${threshold}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [threshold])

  return (
    <div className="bg-white rounded-2xl border border-skin-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-skin-50">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base">{badge}</span>
          <h3 className="font-display text-lg font-light text-charcoal-900">{label}</h3>
        </div>
        <p className="text-xs text-charcoal-500 font-body">
          Products used by people with {threshold}+ skin score
          {data?.skinType ? ` · ${data.skinType} skin` : ''}
        </p>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
          </div>
        ) : !data || data.products.length === 0 ? (
          <div className="text-center py-5">
            <Users className="w-8 h-8 text-charcoal-200 mx-auto mb-2" />
            <p className="text-sm text-charcoal-500 font-body">
              {data?.userCount === 0
                ? 'No users have reached this score yet.'
                : `${data?.userCount} user${data?.userCount !== 1 ? 's' : ''} qualified — not enough product data yet.`}
            </p>
            <p className="text-xs text-charcoal-400 font-body mt-1">
              Be an early tracker — your data helps build this list.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-charcoal-400 font-body mb-3">
              Based on {data.userCount} user{data.userCount !== 1 ? 's' : ''} who reached {threshold}+
            </p>
            <div className="space-y-2">
              {data.products.map((p, i) => (
                <ProductCard key={i} product={p} region={region} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function CommunityPicks({ region }: { region?: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-charcoal-500" />
        <h2 className="font-display text-xl font-light text-charcoal-900">Community Picks</h2>
      </div>
      <p className="text-xs text-charcoal-500 font-body -mt-2">
        Products used by people with similar skin type who achieved high scores.
        As more users join, this gets more accurate.
      </p>

      <Tier threshold={75} label="Working well" badge="🟡" region={region} />
      <Tier threshold={80} label="Working great" badge="🟢" region={region} />

      <p className="text-xs text-center text-charcoal-400 font-body pt-1">
        The more people track, the more accurate this becomes. ✨
      </p>
    </div>
  )
}
