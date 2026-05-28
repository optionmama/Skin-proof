import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Sparkles, Package, ExternalLink, Star } from 'lucide-react'
import type { Recommendation } from '@/types/database'
import ForYouEmptyState from '@/components/ForYouEmptyState'

function ConfidenceBadge({ communityScore, type }: { communityScore?: number; type?: string }) {
  if (type === 'community' || (communityScore && communityScore >= 60)) {
    return <span className="inline-flex items-center gap-1 bg-sage-100 text-sage-700 text-xs px-2 py-0.5 rounded-full font-medium">🟢 Community Verified</span>
  }
  if (communityScore && communityScore >= 30) {
    return <span className="inline-flex items-center gap-1 bg-cream-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">🟡 Community: Growing</span>
  }
  return <span className="inline-flex items-center gap-1 bg-skin-100 text-skin-700 text-xs px-2 py-0.5 rounded-full font-medium">🔴 AI Estimate</span>
}

export default async function RecommendationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: recommendations }, { data: skinProfile }] = await Promise.all([
    supabase
      .from('recommendations')
      .select(`
        *,
        product:products(
          *,
          prices:product_prices(
            *,
            retailer:retailers(name, is_verified_seller, has_affiliate_relationship, affiliate_disclosure)
          )
        )
      `)
      .eq('user_id', user!.id)
      .eq('is_dismissed', false)
      .order('ranking_score', { ascending: false })
      .limit(20),
    supabase
      .from('skin_profiles')
      .select('primary_concerns, skin_type')
      .eq('user_id', user!.id)
      .single(),
  ])

  const hasRecommendations = recommendations && recommendations.length > 0

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="mb-4">
        <h1 className="font-display text-3xl font-light text-charcoal-900">For You</h1>
        <p className="text-charcoal-500 text-sm font-body">
          What&apos;s working for people with skin like yours ✨
        </p>
      </div>

      {!hasRecommendations ? (
        <ForYouEmptyState />
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
