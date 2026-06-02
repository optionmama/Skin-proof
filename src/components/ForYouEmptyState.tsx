'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, Lightbulb, Package, ShoppingCart, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import CommunityPicks from './CommunityPicks'

type RoutineItem = {
  productId: string
  brand: string
  name: string
  status: 'ok' | 'warning' | 'info'
  message: string
  hasIngredients: boolean
}

const GOOGLE_DOMAINS: Record<string, string> = {
  Asia:      'https://www.google.com.tw/search',
  Americas:  'https://www.google.com/search',
  Europe:    'https://www.google.co.uk/search',
  Australia: 'https://www.google.com.au/search',
  Global:    'https://www.google.com/search',
}

const getGoogleShoppingUrl = (brand: string, name: string, region = 'Global') => {
  const domain = GOOGLE_DOMAINS[region] || GOOGLE_DOMAINS['Global']
  return `${domain}?q=${encodeURIComponent(`${brand} ${name}`)}&tbm=shop`
}

const getRegionFromTimezone = (tz: string): string => {
  if (tz.startsWith('Asia/')) return 'Asia'
  if (tz.startsWith('America/')) return 'Americas'
  if (tz.startsWith('Europe/')) return 'Europe'
  if (tz.startsWith('Australia/') || tz.startsWith('Pacific/Auckland')) return 'Australia'
  return 'Global'
}

interface AiProduct {
  name: string
  brand: string
  key_ingredient: string
  why: string
  price_range: string
  available_at?: string
  suitable_for: string
}

interface RecommendationData {
  skinType: string
  concerns: string[]
  mainConcern: string | null
  scanDate: string | null
  hasScanData: boolean
  ingredientSuggestion: { ingredients: string[]; reason: string }
  productWarnings: { name: string; ingredient: string; concern: string }[]
  hasProducts: boolean
  aiProducts: AiProduct[]
  userRegion: string
}

export default function ForYouEmptyState({
  routineItems = [],
  fromScan = false,
  scanConcern = '',
}: {
  routineItems?: RoutineItem[]
  fromScan?: boolean
  scanConcern?: string
}) {
  const [data, setData] = useState<RecommendationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const detectedRegion = getRegionFromTimezone(tz)
    fetch(`/api/ai-recommendations?region=${encodeURIComponent(detectedRegion)}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-skin-400" />
        <p className="text-sm text-charcoal-500 font-body">Building your profile recommendations…</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Section 1 — Routine compatibility check */}
      <div className="bg-white rounded-2xl border border-skin-100 overflow-hidden">
        <div className="p-4 border-b border-skin-50">
          <h2 className="font-display text-xl font-light text-charcoal-900">Your routine today</h2>
          <p className="text-xs text-charcoal-500 font-body mt-0.5">Checked against today&apos;s scan results</p>
        </div>
        {routineItems.length === 0 ? (
          <div className="p-4 flex gap-3">
            <span className="text-lg shrink-0">📝</span>
            <div>
              <p className="text-sm text-charcoal-700 font-body leading-relaxed">
                Add products in the Diary tab and we&apos;ll check if they suit your skin today.
              </p>
              <Link href="/dashboard/diary" className="inline-block mt-2 text-xs text-skin-600 font-medium underline">
                Go to Diary →
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-skin-50">
            {routineItems.map((item, i) => (
              <div key={i} className="p-4 flex gap-3 items-start">
                {item.status === 'ok' && <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />}
                {item.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                {item.status === 'info' && <Info className="w-4 h-4 text-charcoal-400 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal-900">{item.brand} {item.name}</p>
                  <p className={`text-xs font-body leading-relaxed mt-0.5 ${
                    item.status === 'warning' ? 'text-amber-700' :
                    item.status === 'ok' ? 'text-sage-700' : 'text-charcoal-500'
                  }`}>{item.message}</p>
                  {!item.hasIngredients && (
                    <Link href={`/dashboard/diary/${item.productId}`} className="inline-block mt-1 text-xs text-skin-600 font-medium underline">
                      Add ingredients →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2 — AI Recommendations */}
      <div>
        <h2 className="font-display text-xl font-light text-charcoal-900 mb-1">Recommended for your skin today</h2>
        <div className="flex items-center gap-1.5 mb-4">
          {data?.hasScanData && data.scanDate ? (
            <>
              <span className="text-xs text-charcoal-500 font-body">Based on AI scan · {data.scanDate}</span>
              {data.mainConcern && data.mainConcern !== 'none' && (
                <span className="bg-skin-100 text-skin-700 text-xs px-2 py-0.5 rounded-full font-medium capitalize">
                  {data.mainConcern}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-xs text-charcoal-500 font-body">Based on your skin profile (no scan yet)</span>
              <Link href="/dashboard/checkin" className="text-xs text-skin-600 font-medium underline">
                Take a scan →
              </Link>
            </>
          )}
        </div>


        {/* Ingredient suggestion */}
        {data?.ingredientSuggestion && (
          <div className="bg-sage-50 border border-sage-200 rounded-2xl p-4 flex gap-3 mb-4">
            <Lightbulb className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-sage-800 mb-1">
                💡 Your skin may benefit from {data.ingredientSuggestion.ingredients.join(', ')}
              </p>
              <p className="text-xs text-sage-700 font-body leading-relaxed">
                {data.ingredientSuggestion.reason}
              </p>
            </div>
          </div>
        )}

        {/* AI product recommendations */}
        {data?.aiProducts && data.aiProducts.length > 0 && (
          <div className="space-y-3">
            {data.aiProducts.map((product, i) => (
              <div key={i} className="bg-white rounded-2xl border border-skin-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-skin-50 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-skin-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal-900 text-sm">{product.name}</p>
                    <p className="text-xs text-charcoal-500 mb-2">{product.brand}</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="bg-sage-50 text-sage-700 text-xs px-2 py-0.5 rounded-full border border-sage-200">
                        ✓ {product.key_ingredient}
                      </span>
                      <span className="bg-skin-50 text-skin-600 text-xs px-2 py-0.5 rounded-full border border-skin-200 capitalize">
                        {product.suitable_for}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-600 font-body leading-relaxed">{product.why}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-charcoal-400 font-body">~{product.price_range}</p>
                      {product.available_at && (
                        <p className="text-xs text-sage-600 font-body">📍 {product.available_at}</p>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={getGoogleShoppingUrl(product.brand, product.name, data?.userRegion)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center gap-2 border border-skin-300 text-skin-700 py-2.5 rounded-xl text-xs font-medium hover:bg-skin-50 transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Find best price on Google Shopping ↗
                </a>
              </div>
            ))}
            <p className="text-xs text-charcoal-400 font-body text-center px-4 leading-relaxed">
              Suggested by AI based on your skin profile.<br />
              No community data yet — recommendations improve as more users join.
            </p>
          </div>
        )}
      </div>

      {/* Section 3 — Community Picks */}
      <CommunityPicks region={data?.userRegion} />
    </div>
  )
}
