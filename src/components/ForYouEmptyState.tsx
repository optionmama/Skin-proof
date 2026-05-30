'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, Lightbulb, Package, Users, ShoppingCart } from 'lucide-react'

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

export default function ForYouEmptyState() {
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
      {/* Section A */}
      <div>
        <h2 className="font-display text-xl font-light text-charcoal-900 mb-1">Based on your skin profile</h2>
        {data?.hasScanData && data.scanDate ? (
          <div className="flex items-center gap-1.5 mb-4">
            <span className="text-xs text-charcoal-500 font-body">Based on your last scan · {data.scanDate}</span>
            {data.mainConcern && data.mainConcern !== 'none' && (
              <span className="bg-skin-100 text-skin-700 text-xs px-2 py-0.5 rounded-full font-medium capitalize">
                AI detected: {data.mainConcern}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs text-charcoal-500 font-body">Based on your skin profile (no scan yet)</p>
            <Link href="/checkin" className="text-xs text-skin-600 font-medium underline">
              Take a scan →
            </Link>
          </div>
        )}

        {/* Product warning or diary prompt */}
        {data?.productWarnings && data.productWarnings.length > 0 ? (
          <div className="space-y-2 mb-4">
            {data.productWarnings.map((w, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-body leading-relaxed">
                  <strong>⚠️ Consider taking a break from {w.name}</strong><br />
                  It contains <em>{w.ingredient}</em> which may {w.concern}.
                  Try skipping it for 5–7 days to see if your skin improves.
                </p>
              </div>
            ))}
          </div>
        ) : !data?.hasProducts ? (
          <div className="bg-skin-50 border border-skin-200 rounded-2xl p-4 flex gap-3 mb-4">
            <span className="text-lg shrink-0">📝</span>
            <div>
              <p className="text-sm text-charcoal-700 font-body leading-relaxed">
                Add products to your routine in the Diary tab, and we&apos;ll flag anything that might be affecting your skin.
              </p>
              <Link href="/dashboard/diary/add"
                className="inline-block mt-2 text-xs text-skin-600 font-medium underline">
                Add your first product →
              </Link>
            </div>
          </div>
        ) : null}

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

      {/* Section B — Community teaser */}
      <div className="bg-charcoal-900 rounded-2xl p-5 text-center">
        <Users className="w-6 h-6 text-skin-300 mx-auto mb-3" />
        <h3 className="font-display text-lg font-light text-white mb-2">
          The more people join, the smarter this gets 🌟
        </h3>
        <p className="text-xs text-charcoal-300 font-body leading-relaxed mb-3">
          Right now, recommendations are based on your skin profile and ingredient analysis.
          As SkinProof grows, you&apos;ll be able to see exactly what products helped people with
          skin like yours — same skin type, same concerns, same age range — reach a skin score of 85+.
          <br /><br />
          Real results. Real people. No guesswork.
        </p>
        <span className="inline-block text-xs text-charcoal-500 border border-charcoal-700 px-3 py-1 rounded-full">
          Community data: coming soon
        </span>
      </div>
    </div>
  )
}
