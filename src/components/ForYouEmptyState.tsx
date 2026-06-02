'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Loader2, Lightbulb, Package, ShoppingCart, CheckCircle2, AlertTriangle } from 'lucide-react'
import CommunityPicks from './CommunityPicks'

export interface IngredientsData {
  product_found?: boolean
  full_name?: string
  category?: string
  key_ingredients?: string[]
  all_notable_ingredients?: string[]
  skin_type_suitable?: string[]
  concerns_targeted?: string[]
  ingredients_to_flag?: {
    comedogenic?: string[]
    irritating?: string[]
    actives?: string[]
  }
}

export interface RoutineProduct {
  productId: string
  brand: string
  name: string
  category: string
  routineType: string
  ingredientsData: IngredientsData | null
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
  hasProducts: boolean
  aiProducts: AiProduct[]
  userRegion: string
}

interface ReplacementProduct {
  name: string
  brand: string
  category: string
  key_ingredient: string
  why: string
  price_range: string
  available_at?: string
}

type CompatResult =
  | { status: 'loading' }
  | { status: 'good'; message: string }
  | { status: 'warning'; flags: { ingredient: string; message: string }[] }

function checkCompatibility(
  product: RoutineProduct,
  scanDimensions: Record<string, number> | null,
  mainConcern: string | null
): CompatResult {
  const ingredients = product.ingredientsData
  if (!ingredients) return { status: 'loading' }

  const d = scanDimensions || {}
  const flags: { ingredient: string; message: string }[] = []
  const flagSet = ingredients.ingredients_to_flag || {}

  // Comedogenic — flag if oiliness or breakouts high
  if ((((d.oiliness ?? 0) > 60) || ((d.breakouts ?? 0) > 50)) && (flagSet.comedogenic?.length ?? 0) > 0) {
    const ing = flagSet.comedogenic![0]
    flags.push({ ingredient: ing, message: `Contains ${ing} which may worsen oiliness or clog pores. Consider skipping tonight.` })
  }

  // Irritating — flag if redness high
  if (((d.redness ?? 0) > 55) && (flagSet.irritating?.length ?? 0) > 0) {
    const ing = flagSet.irritating![0]
    flags.push({ ingredient: ing, message: `Contains ${ing} which may increase sensitivity. Use with caution.` })
  }

  if (flags.length === 0) {
    const targets = ingredients.concerns_targeted || []
    const concern = (mainConcern || '').toLowerCase()
    const isHelpful = concern.length > 0 && targets.some(c => {
      const cl = c.toLowerCase()
      return cl.includes(concern) || concern.includes(cl)
    })
    return {
      status: 'good',
      message: isHelpful
        ? `Good choice — targets your detected ${mainConcern} concern.`
        : 'Compatible with your current skin condition.',
    }
  }

  return { status: 'warning', flags }
}

export default function ForYouEmptyState({
  routineProducts = [],
  scanDimensions = null,
  mainConcern = null,
  fromScan = false,
  scanConcern = '',
}: {
  routineProducts?: RoutineProduct[]
  scanDimensions?: Record<string, number> | null
  mainConcern?: string | null
  fromScan?: boolean
  scanConcern?: string
}) {
  const [products, setProducts] = useState<RoutineProduct[]>(routineProducts)
  const [data, setData] = useState<RecommendationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState('Asia')
  const [replacements, setReplacements] = useState<ReplacementProduct[] | null>(null)
  const [loadingReplacements, setLoadingReplacements] = useState(false)

  const effectiveConcern = mainConcern || scanConcern || null
  const hasRoutineProducts = products.length > 0
  const needsLookup = useMemo(() => products.some(p => !p.ingredientsData), [products])

  // Detect region + (only when there are no routine products) fetch general AI recs
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const detectedRegion = getRegionFromTimezone(tz)
    setRegion(detectedRegion)

    if (routineProducts.length === 0) {
      fetch(`/api/ai-recommendations?region=${encodeURIComponent(detectedRegion)}`)
        .then(r => r.json())
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [routineProducts.length])

  // Background-fill ingredients for products missing data
  useEffect(() => {
    if (!needsLookup) return
    fetch('/api/lookup-product-ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
      .then(r => r.json())
      .then((res: { results?: { id: string; ingredients_data: IngredientsData }[] }) => {
        if (!res.results?.length) return
        setProducts(prev => prev.map(p => {
          const match = res.results!.find(r => r.id === p.productId)
          return match ? { ...p, ingredientsData: match.ingredients_data } : p
        }))
      })
      .catch(() => {})
  }, [needsLookup])

  // Compute compatibility for each product
  const checked = useMemo(
    () => products.map(p => ({ product: p, result: checkCompatibility(p, scanDimensions, effectiveConcern) })),
    [products, scanDimensions, effectiveConcern]
  )

  const stillLoading = checked.some(c => c.result.status === 'loading')
  const warningItems = checked.filter(c => c.result.status === 'warning')
  const allGood = hasRoutineProducts && !stillLoading && warningItems.length === 0

  // When a product is flagged, fetch replacement recommendations
  useEffect(() => {
    if (stillLoading || warningItems.length === 0 || replacements !== null || loadingReplacements) return
    const flagged = warningItems[0]
    const result = flagged.result as { status: 'warning'; flags: { ingredient: string; message: string }[] }
    setLoadingReplacements(true)
    fetch('/api/routine-replacements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: flagged.product.brand,
        productName: flagged.product.name,
        category: flagged.product.category,
        flaggedIngredient: result.flags[0]?.ingredient || '',
        detectedConcern: effectiveConcern || 'general skin health',
        region,
      }),
    })
      .then(r => r.json())
      .then((res: { products?: ReplacementProduct[] }) => setReplacements(res.products || []))
      .catch(() => setReplacements([]))
      .finally(() => setLoadingReplacements(false))
  }, [stillLoading, warningItems.length, replacements, loadingReplacements, effectiveConcern, region])

  if (loading) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-skin-400" />
        <p className="text-sm text-charcoal-500 font-body">Building your recommendations…</p>
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
        {!hasRoutineProducts ? (
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
            {checked.map(({ product, result }, i) => (
              <div key={i} className="p-4 flex gap-3 items-start">
                {result.status === 'loading' && <Loader2 className="w-4 h-4 text-charcoal-400 shrink-0 mt-0.5 animate-spin" />}
                {result.status === 'good' && <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />}
                {result.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-charcoal-900">{product.brand} {product.name}</p>
                    {product.routineType && (
                      <span className="text-[10px] text-charcoal-400 font-mono bg-skin-50 px-1.5 py-0.5 rounded">{product.routineType}</span>
                    )}
                  </div>
                  {result.status === 'loading' && (
                    <p className="text-xs text-charcoal-400 font-body mt-0.5">Looking up ingredients…</p>
                  )}
                  {result.status === 'good' && (
                    <p className="text-xs text-sage-700 font-body leading-relaxed mt-0.5">{result.message}</p>
                  )}
                  {result.status === 'warning' && (
                    <div className="mt-0.5">
                      {result.flags.map((f, fi) => (
                        <p key={fi} className="text-xs text-amber-700 font-body leading-relaxed">{f.message}</p>
                      ))}
                      <a href="#replacements" className="inline-block mt-1 text-xs text-skin-600 font-medium underline">
                        Find a replacement →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2 — Conditional: routine great / replacements / general recs */}
      {hasRoutineProducts ? (
        allGood ? (
          <div className="bg-sage-50 border border-sage-200 rounded-2xl p-5 text-center">
            <p className="font-display text-lg font-medium text-sage-800 mb-1">Your current routine looks great for today&apos;s skin! 💚</p>
            <p className="text-sm text-sage-700 font-body leading-relaxed mb-1">
              No new products needed right now.
            </p>
            <p className="text-xs text-sage-600 font-body">
              Keep using your current routine and check back tomorrow.
            </p>
          </div>
        ) : !stillLoading && warningItems.length > 0 ? (
          <div id="replacements">
            <h2 className="font-display text-xl font-light text-charcoal-900 mb-1">We found a potential issue with your routine</h2>
            <p className="text-xs text-charcoal-500 font-body mb-4">
              Here are alternatives that better suit today&apos;s skin
            </p>
            {loadingReplacements || replacements === null ? (
              <div className="flex items-center gap-2 py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-skin-400" />
                <span className="text-sm text-charcoal-500 font-body">Finding better alternatives…</span>
              </div>
            ) : replacements.length === 0 ? (
              <p className="text-sm text-charcoal-500 font-body text-center py-4">
                No suitable alternatives found right now. Try again later.
              </p>
            ) : (
              <div className="space-y-3">
                {replacements.map((product, i) => (
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
                            {product.category}
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
                      href={getGoogleShoppingUrl(product.brand, product.name, region)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full flex items-center justify-center gap-2 border border-skin-300 text-skin-700 py-2.5 rounded-xl text-xs font-medium hover:bg-skin-50 transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Find best price on Google Shopping ↗
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null
      ) : (
        /* No routine products — show general AI recommendations for new users */
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
      )}

      {/* Section 3 — Community Picks */}
      <CommunityPicks region={region} />
    </div>
  )
}
