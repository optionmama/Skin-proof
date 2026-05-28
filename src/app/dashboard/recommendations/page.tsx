import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Sparkles, Info, Package, ExternalLink, Star } from 'lucide-react'
import type { Recommendation } from '@/types/database'

export default async function RecommendationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: recommendations } = await supabase
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
    .limit(20)

  const { data: skinProfile } = await supabase
    .from('skin_profiles')
    .select('primary_concerns, skin_type')
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="mb-5">
        <h1 className="font-display text-3xl font-light text-charcoal-900">For You</h1>
        <p className="text-charcoal-500 text-sm font-body">
          Personalised for your {skinProfile?.skin_type || 'skin'} profile
        </p>
      </div>

      {/* Commission-free notice */}
      <div className="bg-sage-50 border border-sage-200 rounded-xl p-4 mb-5 flex gap-3">
        <Info className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-sage-800 mb-1">Transparent rankings</p>
          <p className="text-xs text-sage-700 font-body leading-relaxed">
            Products are ranked solely by skin type compatibility, ingredient analysis,
            and community outcomes. <strong>Affiliate commission rates never influence rankings.</strong>
            Any affiliate relationships are clearly disclosed on each retailer link.
          </p>
        </div>
      </div>

      {/* Skin concerns context */}
      {skinProfile?.primary_concerns && skinProfile.primary_concerns.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-charcoal-500 mb-2 font-body">Targeting your concerns:</p>
          <div className="flex flex-wrap gap-1.5">
            {skinProfile.primary_concerns.map(c => (
              <span key={c} className="bg-skin-100 text-skin-700 text-xs px-3 py-1 rounded-full font-medium capitalize">
                {c.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {!recommendations || recommendations.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-skin-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-skin-400" />
          </div>
          <h3 className="font-display text-xl font-light text-charcoal-800 mb-2">No recommendations yet</h3>
          <p className="text-charcoal-500 text-sm font-body mb-5 max-w-xs mx-auto">
            Complete your skin profile and a few check-ins to receive personalised recommendations.
          </p>
          <Link href="/dashboard/checkin" className="inline-flex items-center gap-2 bg-skin-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium">
            Start check-in
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => {
            const product = rec.product as typeof rec.product & {
              prices?: Array<{
                price: number;
                currency: string;
                affiliate_url?: string;
                affiliate_disclosure?: string;
                product_url?: string;
                retailer?: {
                  name: string;
                  is_verified_seller: boolean;
                  has_affiliate_relationship: boolean;
                  affiliate_disclosure?: string;
                };
              }>;
            }
            if (!product) return null

            const lowestPrice = product.prices?.sort((a, b) => a.price - b.price)[0]

            return (
              <div key={rec.id} className="bg-white rounded-2xl border border-skin-100 overflow-hidden">
                {/* Rank badge */}
                <div className="flex items-center gap-3 p-4 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-skin-100 flex items-center justify-center shrink-0">
                    {index === 0 ? (
                      <Star className="w-4 h-4 fill-cream-400 text-cream-400" />
                    ) : (
                      <span className="text-xs font-bold text-skin-600 font-mono">#{index + 1}</span>
                    )}
                  </div>

                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-skin-50 flex items-center justify-center">
                      <Package className="w-5 h-5 text-skin-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal-900 text-sm truncate">{product.name}</p>
                    <p className="text-xs text-charcoal-500">{product.brand}</p>
                  </div>

                  {rec.ranking_score && (
                    <div className="text-right shrink-0">
                      <p className="font-display text-lg font-medium text-skin-500">
                        {Math.round(rec.ranking_score * 100)}%
                      </p>
                      <p className="text-xs text-charcoal-400 font-body">match</p>
                    </div>
                  )}
                </div>

                {/* Match reasons */}
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

                {/* Scores */}
                <div className="px-4 pb-3 flex gap-4">
                  {rec.ingredient_compatibility_score && (
                    <div>
                      <p className="text-xs text-charcoal-400 font-body">Ingredient match</p>
                      <p className="text-sm font-medium text-charcoal-800 font-mono">
                        {Math.round(rec.ingredient_compatibility_score)}%
                      </p>
                    </div>
                  )}
                  {rec.community_efficacy_score && (
                    <div>
                      <p className="text-xs text-charcoal-400 font-body">Community rating</p>
                      <p className="text-sm font-medium text-charcoal-800 font-mono">
                        {Math.round(rec.community_efficacy_score)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Product attributes */}
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {product.fragrance_free && <span className="text-xs bg-sage-50 text-sage-700 px-2 py-0.5 rounded-full border border-sage-200">Fragrance-free</span>}
                  {product.cruelty_free && <span className="text-xs bg-sage-50 text-sage-700 px-2 py-0.5 rounded-full border border-sage-200">Cruelty-free</span>}
                  {product.vegan && <span className="text-xs bg-sage-50 text-sage-700 px-2 py-0.5 rounded-full border border-sage-200">Vegan</span>}
                  {product.dermatologist_tested && <span className="text-xs bg-sage-50 text-sage-700 px-2 py-0.5 rounded-full border border-sage-200">Derm-tested</span>}
                </div>

                {/* Price and link */}
                {lowestPrice && (
                  <div className="border-t border-skin-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-charcoal-900">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: lowestPrice.currency }).format(lowestPrice.price)}
                        </p>
                        {lowestPrice.retailer && (
                          <p className="text-xs text-charcoal-500 font-body">
                            at {lowestPrice.retailer.name}
                            {lowestPrice.retailer.is_verified_seller && ' ✓'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/prices/${product.id}`}
                          className="text-xs text-skin-600 font-medium hover:text-skin-700"
                        >
                          Compare prices
                        </Link>
                        {(lowestPrice.affiliate_url || lowestPrice.product_url) && (
                          <a
                            href={lowestPrice.affiliate_url || lowestPrice.product_url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="flex items-center gap-1 bg-skin-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-skin-600 transition-colors"
                          >
                            Shop
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Affiliate disclosure — REQUIRED when affiliate link present */}
                    {lowestPrice.affiliate_url && (lowestPrice.affiliate_disclosure || lowestPrice.retailer?.affiliate_disclosure) && (
                      <p className="text-xs text-charcoal-400 font-body mt-2 italic">
                        🔗 {lowestPrice.affiliate_disclosure || lowestPrice.retailer?.affiliate_disclosure}
                      </p>
                    )}
                  </div>
                )}

                {/* Ranking transparency note */}
                <div className="bg-skin-50 px-4 py-2 border-t border-skin-100">
                  <p className="text-xs text-charcoal-400 font-body">
                    ℹ Ranked by skin compatibility score — not affiliate commission
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
