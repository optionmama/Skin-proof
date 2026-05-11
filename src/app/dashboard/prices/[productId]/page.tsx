import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ExternalLink, Check, AlertTriangle, TrendingDown, Package } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default async function PriceComparisonPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (!product) return notFound()

  const { data: prices } = await supabase
    .from('product_prices')
    .select(`
      *,
      retailer:retailers(*)
    `)
    .eq('product_id', productId)
    .eq('in_stock', true)
    .order('price')

  const lowestPrice = prices?.[0]
  const highestPrice = prices?.[prices.length - 1]
  const avgPrice = prices?.length
    ? prices.reduce((s, p) => s + p.price, 0) / prices.length
    : 0

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Back */}
      <Link href="/dashboard/recommendations" className="text-sm text-skin-600 hover:text-skin-700 mb-4 inline-block font-body">
        ← Back to recommendations
      </Link>

      {/* Product header */}
      <div className="bg-white rounded-2xl border border-skin-100 p-5 mb-4">
        <div className="flex gap-4 items-start">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-skin-100 flex items-center justify-center shrink-0">
              <Package className="w-7 h-7 text-skin-400" />
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-light text-charcoal-900 leading-tight">{product.name}</h1>
            <p className="text-charcoal-500 text-sm mb-2">{product.brand}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs bg-skin-100 text-skin-600 px-2 py-0.5 rounded-full capitalize">
                {product.category.replace(/_/g, ' ')}
              </span>
              {product.size_ml && (
                <span className="text-xs bg-charcoal-100 text-charcoal-600 px-2 py-0.5 rounded-full">
                  {product.size_ml}ml
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Price summary */}
      {prices && prices.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-sage-50 border border-sage-200 rounded-xl p-3 text-center">
            <p className="text-xs text-sage-600 font-body mb-1">Lowest</p>
            <p className="font-display text-xl font-medium text-sage-700">
              {formatCurrency(lowestPrice!.price, lowestPrice!.currency)}
            </p>
          </div>
          <div className="bg-skin-50 border border-skin-200 rounded-xl p-3 text-center">
            <p className="text-xs text-charcoal-500 font-body mb-1">Average</p>
            <p className="font-display text-xl font-medium text-charcoal-700">
              {formatCurrency(avgPrice, prices[0].currency)}
            </p>
          </div>
          <div className="bg-white border border-skin-200 rounded-xl p-3 text-center">
            <p className="text-xs text-charcoal-500 font-body mb-1">Highest</p>
            <p className="font-display text-xl font-medium text-charcoal-700">
              {formatCurrency(highestPrice!.price, highestPrice!.currency)}
            </p>
          </div>
        </div>
      )}

      {/* Transparency notice */}
      <div className="bg-sage-50 border border-sage-200 rounded-xl p-4 mb-4 flex gap-3">
        <Check className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-sage-800 mb-1">Price comparison transparency</p>
          <p className="text-xs text-sage-700 font-body leading-relaxed">
            Prices are sorted from lowest to highest. Any affiliate relationships are
            <strong> clearly disclosed below each retailer</strong>. Affiliate status
            does not affect the order of results.
          </p>
        </div>
      </div>

      {/* Prices list */}
      <h2 className="font-display text-xl font-light text-charcoal-900 mb-3">Available from</h2>

      {!prices || prices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-skin-100 p-6 text-center">
          <p className="text-charcoal-500 font-body text-sm">No prices available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prices.map((price, index) => {
            const retailer = price.retailer as typeof price.retailer & {
              name: string;
              website_url?: string;
              is_verified_seller: boolean;
              has_affiliate_relationship: boolean;
              affiliate_disclosure?: string;
              return_policy_url?: string;
            }
            const savings = index > 0
              ? ((prices[0].price - price.price) / price.price * 100)
              : null
            const priceDiff = index > 0 ? price.price - prices[0].price : 0

            return (
              <div
                key={price.id}
                className={`bg-white rounded-2xl border overflow-hidden ${
                  index === 0 ? 'border-sage-300 ring-1 ring-sage-200' : 'border-skin-100'
                }`}
              >
                {index === 0 && (
                  <div className="bg-sage-500 text-white text-xs font-medium px-4 py-1.5 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Best price
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-charcoal-900">{retailer?.name}</p>
                        {retailer?.is_verified_seller && (
                          <span className="bg-sage-100 text-sage-700 text-xs px-1.5 py-0.5 rounded font-medium">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      {price.is_sale && (
                        <span className="bg-skin-100 text-skin-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          🏷 On sale
                          {price.sale_ends_at && ` · ends ${new Date(price.sale_ends_at).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-display text-2xl font-medium text-charcoal-900">
                        {formatCurrency(price.price, price.currency)}
                      </p>
                      {price.price_per_ml && (
                        <p className="text-xs text-charcoal-400 font-mono">
                          {formatCurrency(price.price_per_ml, price.currency)}/ml
                        </p>
                      )}
                      {priceDiff > 0 && (
                        <p className="text-xs text-skin-500 font-body">
                          +{formatCurrency(priceDiff, price.currency)} more
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shop button */}
                  <div className="flex gap-2">
                    {price.product_url && (
                      <a
                        href={price.product_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="flex-1 flex items-center justify-center gap-1.5 border border-skin-200 text-charcoal-700 text-sm py-2.5 rounded-xl hover:bg-skin-50 transition-colors font-medium"
                      >
                        View product
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {price.affiliate_url && (
                      <a
                        href={price.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow sponsored"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-skin-500 text-white text-sm py-2.5 rounded-xl hover:bg-skin-600 transition-colors font-medium"
                      >
                        Shop now
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* AFFILIATE DISCLOSURE — mandatory */}
                  {price.affiliate_url && (
                    <div className="mt-3 flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 font-body leading-relaxed">
                        <strong>Affiliate disclosure:</strong>{' '}
                        {price.affiliate_disclosure ||
                         retailer?.affiliate_disclosure ||
                         'SkinProof may earn a commission from purchases made via this link at no extra cost to you.'}
                      </p>
                    </div>
                  )}

                  {/* Return policy */}
                  {retailer?.return_policy_url && (
                    <a
                      href={retailer.return_policy_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-charcoal-400 hover:text-skin-600 font-body mt-2 inline-block"
                    >
                      View return policy →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-center text-charcoal-400 font-body mt-4">
        Prices last updated by community. May not reflect current prices.
      </p>
    </div>
  )
}
