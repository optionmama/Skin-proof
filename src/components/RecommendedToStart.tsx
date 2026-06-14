'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ArrowLeft, ShoppingCart, Sparkles, AlertTriangle, BookOpen, Stethoscope } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'
import { getGoogleShoppingUrl, getRegionFromTimezone, skinConcernLabel } from '@/lib/utils'
import { matchSeedProducts, matchedConcern, type SeedProduct, type SeedAgeGroup, type SeedCategory } from '@/lib/seed-products'

type TFn = (key: TranslationKey, vars?: Record<string, string | number>) => string
type Variant = 'clinical' | 'blue' | 'coral' | 'amber'
type BadgeType = 'derm' | 'review' | 'rx'

const VARIANT_BY_CATEGORY: Record<SeedCategory, Variant> = {
  cleanser: 'blue', toner: 'blue', sunscreen: 'blue',
  serum: 'clinical', essence: 'clinical', ampoule: 'clinical',
  exfoliant: 'coral', treatment: 'coral',
  moisturizer: 'amber', eye: 'amber',
}

function thumbVariant(product: SeedProduct): Variant {
  return product.isRx ? 'amber' : VARIANT_BY_CATEGORY[product.category]
}

function badgeType(product: SeedProduct): BadgeType {
  if (product.isRx) return 'rx'
  return product.confidence === 'high' ? 'derm' : 'review'
}

function timelineLabel(days: number, t: TFn): string {
  if (days === 0) return t('foryou_timeline_daily')
  if (days < 14) return t('foryou_timeline_days', { days })
  return t('foryou_timeline_weeks', { weeks: Math.round(days / 7) })
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

function ProductGlyph({ variant, large = false }: { variant: Variant; large?: boolean }) {
  const bg: Record<Variant, string> = {
    clinical: 'from-stone-100 to-stone-200',
    blue: 'from-sky-50 to-sky-100',
    coral: 'from-skin-100 to-skin-200',
    amber: 'from-amber-50 to-amber-100',
  }
  const size = large ? 'w-24 h-28' : 'w-[68px] h-20'
  const dim = large ? { width: 46, height: 68 } : { width: 34, height: 50 }
  return (
    <div className={`${size} rounded-2xl bg-gradient-to-br ${bg[variant]} flex items-center justify-center shrink-0`}>
      <svg {...dim} viewBox="0 0 40 60" fill="none">
        {variant === 'clinical' && (
          <>
            <rect x="13" y="2" width="14" height="9" rx="2" fill="#d7dcd6" />
            <rect x="10" y="11" width="20" height="45" rx="6" fill="#fff" stroke="#dde0db" />
            <rect x="14" y="22" width="12" height="3" rx="1.5" fill="#cdd2cc" />
          </>
        )}
        {variant === 'blue' && (
          <>
            <rect x="15" y="2" width="10" height="8" rx="2" fill="#bcd0de" />
            <rect x="9" y="10" width="22" height="46" rx="5" fill="#fff" stroke="#d3e0e8" />
            <rect x="13" y="40" width="14" height="3" rx="1.5" fill="#bcd0de" />
          </>
        )}
        {variant === 'coral' && (
          <>
            <path d="M14 6h12l-1 4H15z" fill="#e7b6a3" />
            <rect x="13" y="10" width="14" height="46" rx="4" fill="#fff" stroke="#eccdbf" />
            <rect x="16" y="40" width="8" height="2.6" rx="1.3" fill="#e7b6a3" />
          </>
        )}
        {variant === 'amber' && (
          <>
            <rect x="11" y="8" width="18" height="48" rx="3" fill="#fff" stroke="#e6d3a8" />
            <path d="M16 24h8M16 29h8M16 34h5" stroke="#caa24f" strokeWidth="1.6" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  )
}

function ProductBadge({ type, t }: { type: BadgeType; t: TFn }) {
  const config: Record<BadgeType, { cls: string; label: string }> = {
    derm: { cls: 'bg-sage-100 text-sage-700', label: t('foryou_badge_derm') },
    review: { cls: 'bg-blue-50 text-blue-700', label: t('foryou_badge_review') },
    rx: { cls: 'bg-amber-100 text-amber-700', label: t('foryou_badge_rx') },
  }
  const { cls, label } = config[type]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mt-2 ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {label}
    </span>
  )
}

function PriceTier({ product, t }: { product: SeedProduct; t: TFn }) {
  if (product.isRx) {
    return (
      <div className="flex flex-col items-end shrink-0">
        <span className="text-sm font-bold text-amber-600 font-mono">Rx</span>
        <span className="text-[10px] text-charcoal-400 font-medium mt-0.5 whitespace-nowrap">{t('foryou_price_rx')}</span>
      </div>
    )
  }
  const filled = product.priceUsd < 10 ? 1 : product.priceUsd <= 40 ? 2 : 3
  const label = filled === 1 ? t('foryou_price_budget') : filled === 2 ? t('foryou_price_mid') : t('foryou_price_premium')
  return (
    <div className="flex flex-col items-end shrink-0">
      <span className="text-sm font-bold text-skin-600 font-mono tracking-wide">
        {'$'.repeat(filled)}
        <span className="text-skin-200">{'$'.repeat(3 - filled)}</span>
      </span>
      <span className="text-[10px] text-charcoal-400 font-medium mt-0.5">{label}</span>
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm py-1">
      <span className="text-charcoal-400 w-28 shrink-0">{label}</span>
      <span className="text-charcoal-900 font-medium">{value}</span>
    </div>
  )
}

function ProductCard({
  product, concerns, t, onSelect,
}: {
  product: SeedProduct
  concerns: string[]
  t: TFn
  onSelect: () => void
}) {
  const concern = matchedConcern(product, concerns)
  const chips = [
    concern ? skinConcernLabel(concern) : cap(product.concerns[0] || ''),
    cap(product.concerns[1] || ''),
    cap(product.ingredients[0] || ''),
  ].filter(Boolean).slice(0, 3)

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-2xl border border-skin-100 p-4 cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div className="flex gap-3.5">
        <ProductGlyph variant={thumbVariant(product)} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">{product.brand}</p>
          <div className="flex items-start justify-between gap-2 mt-0.5">
            <p className="font-display text-base font-medium text-charcoal-900 leading-tight">{product.name}</p>
            <PriceTier product={product} t={t} />
          </div>
          <ProductBadge type={badgeType(product)} t={t} />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {chips.map((chip, i) => (
              <span key={i} className="text-[11px] text-charcoal-500 bg-skin-50 border border-skin-100 px-2 py-0.5 rounded-full">
                {chip}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-skin-50 text-xs">
            <span className="text-charcoal-500">
              ⏱ <strong className="text-charcoal-800 font-medium">{timelineLabel(product.timelineDays, t)}</strong>
            </span>
            <span className="text-skin-600 font-semibold">
              {product.isRx ? t('foryou_learn_more') : t('foryou_view_buy')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductDetail({
  product, concerns, region, t, onClose,
}: {
  product: SeedProduct
  concerns: string[]
  region: string
  t: TFn
  onClose: () => void
}) {
  const concern = matchedConcern(product, concerns)
  const concernLabel = concern ? skinConcernLabel(concern) : cap(product.concerns[0] || '')

  return (
    <div className="fixed inset-0 z-[60] bg-skin-50 overflow-y-auto">
      <div className="max-w-lg mx-auto min-h-screen pb-12">
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white border border-skin-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-charcoal-700" />
          </button>
        </div>

        <div className="px-4 space-y-3">
          {/* Hero */}
          <div className="bg-white border border-skin-100 rounded-2xl p-4 flex gap-4 items-center">
            <ProductGlyph variant={thumbVariant(product)} large />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">{product.brand}</p>
              <h2 className="font-display text-xl font-medium text-charcoal-900 leading-tight mt-0.5">{product.name}</h2>
              <ProductBadge type={badgeType(product)} t={t} />
              <div className="mt-2.5">
                {product.isRx ? (
                  <>
                    <p className="font-display text-lg font-semibold text-amber-600">{t('foryou_detail_rx_price')}</p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">{t('foryou_detail_rx_price_note')}</p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-lg font-semibold text-charcoal-900">~${product.priceUsd}</p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">{t('foryou_detail_price_note')}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Why it suits you */}
          <div className="bg-white border border-skin-100 rounded-2xl p-4">
            <h5 className="flex items-center gap-2 text-sm font-semibold text-charcoal-900 mb-2">
              <Sparkles className="w-4 h-4 text-skin-500" />
              {t('foryou_detail_why_suits')}
            </h5>
            <KV label={t('foryou_detail_your_concern')} value={concernLabel} />
            <KV label={t('foryou_detail_key_ingredient')} value={cap(product.ingredients[0] || '')} />
            <KV label={t('foryou_detail_typical_results')} value={timelineLabel(product.timelineDays, t)} />
          </div>

          {/* What to watch */}
          <div className="bg-white border border-skin-100 rounded-2xl p-4">
            <h5 className="flex items-center gap-2 text-sm font-semibold text-charcoal-900 mb-2">
              <AlertTriangle className="w-4 h-4 text-skin-500" />
              {t('foryou_detail_what_to_watch')}
            </h5>
            <p className="text-sm text-charcoal-500 font-body leading-relaxed">
              {t(`foryou_risk_${product.irritationRisk}` as TranslationKey)}
            </p>
          </div>

          {/* Evidence */}
          <div className="bg-white border border-skin-100 rounded-2xl p-4">
            <h5 className="flex items-center gap-2 text-sm font-semibold text-charcoal-900 mb-2">
              <BookOpen className="w-4 h-4 text-skin-500" />
              {t('foryou_detail_evidence')}
            </h5>
            <div className="text-xs text-charcoal-500 font-body leading-relaxed bg-skin-50 border border-skin-100 rounded-xl p-3">
              {t('foryou_detail_evidence_body')}
            </div>
          </div>

          {/* Where to buy / Rx CTA */}
          {product.isRx ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <Stethoscope className="w-4 h-4" />
                {t('foryou_detail_rx_title')}
              </p>
              <p className="text-xs text-amber-700 font-body leading-relaxed mt-1.5">{t('foryou_detail_rx_body')}</p>
            </div>
          ) : (
            <div className="bg-white border border-skin-100 rounded-2xl p-4">
              <h5 className="flex items-center gap-2 text-sm font-semibold text-charcoal-900 mb-2.5">
                <ShoppingCart className="w-4 h-4 text-skin-500" />
                {t('foryou_detail_where_to_buy')}
              </h5>
              <a
                href={getGoogleShoppingUrl(product.brand, product.name, region)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 border border-skin-200 rounded-xl p-3 hover:bg-skin-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-charcoal-900">{t('foryou_detail_search_store')}</p>
                  <p className="text-[11px] text-charcoal-400 mt-0.5">{t('foryou_detail_price_note')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-charcoal-800">~${product.priceUsd}</span>
                  <ChevronRight className="w-4 h-4 text-charcoal-400" />
                </div>
              </a>
              <p className="flex items-start gap-1.5 text-[11px] text-charcoal-400 font-body leading-relaxed mt-3">
                <span>ⓘ</span>
                <span>{t('foryou_detail_disclosure')}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RecommendedToStart({
  ageGroup,
  concerns,
}: {
  ageGroup: SeedAgeGroup | null
  concerns: string[]
}) {
  const { t } = useLanguage()
  const [region, setRegion] = useState('Asia')
  const [showWhy, setShowWhy] = useState(false)
  const [selected, setSelected] = useState<SeedProduct | null>(null)

  useEffect(() => {
    setRegion(getRegionFromTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone))
  }, [])

  const products = matchSeedProducts({ ageGroup, concerns }, 4)
  const concernLabels = concerns.map(skinConcernLabel)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-skin-500" />
        <h2 className="font-display text-xl font-light text-charcoal-900">{t('foryou_recommended_start_title')}</h2>
      </div>
      <p className="text-xs text-charcoal-500 font-body -mt-2">
        {concernLabels.length > 0
          ? t('foryou_recommended_start_sub', { concerns: concernLabels.join(', ') })
          : t('foryou_recommended_start_sub_default')}
      </p>

      <div>
        <button
          onClick={() => setShowWhy(v => !v)}
          className="inline-flex items-center gap-1 text-skin-600 text-sm font-semibold font-body"
        >
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showWhy ? 'rotate-90' : ''}`} />
          {t('foryou_why_these')}
        </button>
        {showWhy && (
          <div className="mt-2 bg-white border border-skin-100 rounded-2xl p-3.5 text-xs text-charcoal-500 font-body leading-relaxed">
            {t('foryou_why_these_body')}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {products.map(product => (
          <ProductCard key={product.id} product={product} concerns={concerns} t={t} onSelect={() => setSelected(product)} />
        ))}
      </div>

      {selected && (
        <ProductDetail product={selected} concerns={concerns} region={region} t={t} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
