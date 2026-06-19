import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Sparkles, Package, ExternalLink, Star } from 'lucide-react'
import type { Recommendation } from '@/types/database'
import ForYouEmptyState, { type RoutineProduct } from '@/components/ForYouEmptyState'
import RecommendedToStart from '@/components/RecommendedToStart'
import { getT } from '@/lib/i18n/server'
import { ageRangeToGroup, mainConcernToSkinConcern, deriveScanConcerns, type ScanAnalysis } from '@/lib/utils'

function ConfidenceBadge({ communityScore, type }: { communityScore?: number; type?: string }) {
  if (type === 'community' || (communityScore && communityScore >= 60)) {
    return <span className="inline-flex items-center gap-1 bg-sage-100 text-sage-700 text-xs px-2 py-0.5 rounded-full font-medium">🟢 Community Verified</span>
  }
  if (communityScore && communityScore >= 30) {
    return <span className="inline-flex items-center gap-1 bg-cream-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">🟡 Community: Growing</span>
  }
  return <span className="inline-flex items-center gap-1 bg-skin-100 text-skin-700 text-xs px-2 py-0.5 rounded-full font-medium">🔴 AI Estimate</span>
}

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; concern?: string; date?: string }>
}) {
  const params = await searchParams
  const fromScan = params.from === 'scan'
  const scanConcern = params.concern || ''
  const scanDate = params.date || ''

  const supabase = await createClient()
  const t = await getT()
  const { data: { user } } = await supabase.auth.getUser()

  // recommendations table is empty for now (no official products DB)
  // — always falls through to ForYouEmptyState which uses AI recommendations
  const [{ data: recommendations }, { data: routines }, { data: latestScan }, { data: profile }] = await Promise.all([
    supabase
      .from('recommendations')
      .select('id')
      .eq('user_id', user!.id)
      .eq('is_dismissed', false)
      .limit(1),
    supabase
      .from('user_routines')
      .select('product_id, routine_type, user_products(id, brand, name, category, ingredients_data, product_full_name)')
      .eq('user_id', user!.id)
      .eq('is_active', true),
    supabase
      .from('skin_photos')
      .select('ai_analysis_raw, overall_skin_score')
      .eq('user_id', user!.id)
      .not('overall_skin_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('skin_profiles')
      .select('age_range, primary_concerns')
      .eq('user_id', user!.id)
      .single(),
  ])

  const hasRecommendations = recommendations && recommendations.length > 0

  const scanRaw = latestScan?.ai_analysis_raw as Record<string, unknown> | null
  const dimensions = (scanRaw?.dimensions as Record<string, number> | null) || null
  const mainConcern = (scanRaw?.main_concern as string) || scanConcern || null

  // "Recommended to start" matching inputs.
  // Scan concerns are PRIMARY (they reflect the user's latest skin state and
  // change scan to scan); the onboarding profile is a soft fallback. Listing
  // scan-derived concerns first makes the displayed "based on" labels and the
  // recommendation set track the most recent scan rather than a static profile.
  const ageGroup = ageRangeToGroup(profile?.age_range)
  const scanConcerns = deriveScanConcerns(scanRaw as ScanAnalysis | null)
  const startConcerns = new Set<string>(scanConcerns)
  const mappedMainConcern = mainConcernToSkinConcern(mainConcern)
  if (mappedMainConcern) startConcerns.add(mappedMainConcern)
  for (const c of profile?.primary_concerns || []) startConcerns.add(c)

  // Deduplicate routine products by product id; merge AM/PM into a single label
  const productMap = new Map<string, RoutineProduct>()
  for (const r of (routines || []) as Array<{
    product_id: string
    routine_type: string
    user_products: { id?: string; brand?: string; name?: string; category?: string; ingredients_data?: unknown; product_full_name?: string } | null
  }>) {
    const p = r.user_products
    if (!p) continue
    const id = r.product_id
    const existing = productMap.get(id)
    const rt = (r.routine_type || '').toUpperCase()
    if (existing) {
      // merge routine type label (AM · PM) without duplicating
      const parts = new Set(existing.routineType.split(' · ').filter(Boolean))
      if (rt) parts.add(rt)
      existing.routineType = Array.from(parts).join(' · ')
    } else {
      productMap.set(id, {
        productId: id,
        brand: p.brand || '',
        name: p.product_full_name || p.name || '',
        category: p.category || 'serum',
        routineType: rt,
        ingredientsData: (p.ingredients_data as RoutineProduct['ingredientsData']) || null,
      })
    }
  }
  const routineProducts = Array.from(productMap.values())

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {fromScan && (
        <div className="bg-skin-100 border border-skin-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-skin-500 shrink-0" />
          <p className="text-sm text-skin-700 font-medium">
            {t('foryou_based_on_scan')}{scanDate ? ` · ${scanDate}` : ''}
          </p>
        </div>
      )}
      <div className="mb-4">
        <h1 className="font-display text-3xl font-light text-charcoal-900">{t('foryou_title')}</h1>
        <p className="text-charcoal-500 text-sm font-body">
          {t('foryou_subtitle')}
        </p>
      </div>

      {!hasRecommendations ? (
        <div className="space-y-8">
          <RecommendedToStart ageGroup={ageGroup} concerns={Array.from(startConcerns)} scanConcerns={scanConcerns} />
          <ForYouEmptyState
            routineProducts={routineProducts}
            scanDimensions={dimensions}
            mainConcern={mainConcern}
            fromScan={fromScan}
            scanConcern={scanConcern}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => {
            const product = rec.product as {
              id: string; name: string; brand?: string; image_url?: string
              fragrance_free?: boolean; cruelty_free?: boolean; vegan?: boolean; dermatologist_tested?: boolean
              prices?: Array<{
                price: number; currency: string; affiliate_url?: string; product_url?: string
                affiliate_disclosure?: string
                retailer?: { name: string; is_verified_seller: boolean; has_affiliate_relationship: boolean; affiliate_disclosure?: string }
              }>
            } | null
            if (!product) return null

            const lowestPrice = product.prices?.sort((a, b) => a.price - b.price)[0]

            return (
              <div key={rec.id} className="bg-white rounded-2xl border border-skin-100 overflow-hidden">
                <div className="flex items-center gap-3 p-4 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-skin-100 flex items-center justify-center shrink-0">
                    {index === 0
                      ? <Star className="w-4 h-4 fill-cream-400 text-cream-400" />
                      : <span className="text-xs font-bold text-skin-600 font-mono">#{index + 1}</span>}
                  </div>
                  {product.image_url
                    ? <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                    : <div className="w-12 h-12 rounded-xl bg-skin-50 flex items-center justify-center"><Package className="w-5 h-5 text-skin-400" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal-900 text-sm truncate">{product.name}</p>
                    <p className="text-xs text-charcoal-500">{product.brand}</p>
                  </div>
                  {rec.ranking_score && (
                    <div className="text-right shrink-0">
                      <p className="font-display text-lg font-medium text-skin-500">{Math.round(rec.ranking_score * 100)}%</p>
                      <p className="text-xs text-charcoal-400 font-body">match</p>
                    </div>
                  )}
                </div>

                <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
                  <ConfidenceBadge communityScore={rec.community_efficacy_score ?? undefined} type={rec.recommendation_type} />
                  {rec.community_efficacy_score && rec.community_efficacy_score >= 30 && (
                    <span className="text-xs text-charcoal-400 font-body">
                      {Math.round(40 + rec.community_efficacy_score * 0.4)}% of similar users improved
                    </span>
                  )}
                </div>

                {rec.match_reason && rec.match_reason.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {rec.match_reason.map(reason => (
                        <span key={reason} className="bg-sage-50 text-sage-700 text-xs px-2.5 py-1 rounded-full border border-sage-200">
                          ✓ {reason.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(rec.ingredient_compatibility_score || rec.community_efficacy_score) && (
                  <div className="px-4 pb-3 flex gap-4">
                    {rec.ingredient_compatibility_score && (
                      <div>
                        <p className="text-xs text-charcoal-400 font-body">Ingredient match</p>
                        <p className="text-sm font-medium text-charcoal-800 font-mono">{Math.round(rec.ingredient_compatibility_score)}%</p>
                      </div>
                    )}
                    {rec.community_efficacy_score && (
                      <div>
                        <p className="text-xs text-charcoal-400 font-body">Community rating</p>
                        <p className="text-sm font-medium text-charcoal-800 font-mono">{Math.round(rec.community_efficacy_score)}%</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {product.fragrance_free     && <span className="text-xs bg-sage-50 text-sage-700 px-2 py-0.5 rounded-full border border-sage-200">Fragrance-free</span>}
                  {product.cruelty_free       && <span className="text-xs bg-sage-50 text-sage-700 px-2 py-0.5 rounded-full border border-sage-200">Cruelty-free</span>}
                  {product.vegan              && <span className="text-xs bg-sage-50 text-sage-700 px-2 py-0.5 rounded-full border border-sage-200">Vegan</span>}
                  {product.dermatologist_tested && <span className="text-xs bg-sage-50 text-sage-700 px-2 py-0.5 rounded-full border border-sage-200">Derm-tested</span>}
                </div>

                {lowestPrice && (
                  <div className="border-t border-skin-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-charcoal-900">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: lowestPrice.currency }).format(lowestPrice.price)}
                        </p>
                        {lowestPrice.retailer && (
                          <p className="text-xs text-charcoal-500 font-body">
                            at {lowestPrice.retailer.name}{lowestPrice.retailer.is_verified_seller && ' ✓'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/prices/${product.id}`} className="text-xs text-skin-600 font-medium hover:text-skin-700">
                          Compare prices
                        </Link>
                        {(lowestPrice.affiliate_url || lowestPrice.product_url) && (
                          <a href={lowestPrice.affiliate_url || lowestPrice.product_url}
                            target="_blank" rel="noopener noreferrer nofollow"
                            className="flex items-center gap-1 bg-skin-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-skin-600 transition-colors">
                            Shop <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    {lowestPrice.affiliate_url && (lowestPrice.affiliate_disclosure || lowestPrice.retailer?.affiliate_disclosure) && (
                      <p className="text-xs text-charcoal-400 font-body mt-2 italic">
                        🔗 {lowestPrice.affiliate_disclosure || lowestPrice.retailer?.affiliate_disclosure}
                      </p>
                    )}
                  </div>
                )}

                <div className="bg-skin-50 px-4 py-2 border-t border-skin-100">
                  <p className="text-xs text-charcoal-400 font-body">
                    ℹ Ranked by skin compatibility — not affiliate commission
                  </p>
                </div>
              </div>
            )
          })}

          <div className="bg-skin-50 rounded-2xl p-4 text-center">
            <p className="text-xs text-charcoal-600 font-body leading-relaxed italic">
              The more you track, the smarter this gets —<br />
              and the more you help others with skin like yours. ✨
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
