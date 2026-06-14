'use client'

import { useState, useEffect } from 'react'
import { Users, Package, ShoppingCart, Sparkles } from 'lucide-react'
import type { CommunityProduct } from '@/app/api/community-picks/route'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'
import { getGoogleShoppingUrl } from '@/lib/utils'

type TFn = (key: TranslationKey, vars?: Record<string, string | number>) => string

interface TierData {
  products: CommunityProduct[]
  userCount: number
  threshold: number
  skinType: string | null
}

function ProductCard({ product, region }: { product: CommunityProduct; region?: string }) {
  const { t } = useLanguage()
  const shoppingUrl = getGoogleShoppingUrl(product.brand, product.name, region)

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
        {t('community_find_shopping')}
      </a>
    </div>
  )
}

function Tier({
  data,
  label,
  badge,
  region,
  t,
}: {
  data: TierData | null
  label: string
  badge: string
  region?: string
  t: TFn
}) {
  return (
    <div className="bg-white rounded-2xl border border-skin-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-skin-50">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base">{badge}</span>
          <h3 className="font-display text-lg font-light text-charcoal-900">{label}</h3>
        </div>
        <p className="text-xs text-charcoal-500 font-body">
          {t('community_tier_desc', { threshold: data?.threshold ?? 0 })}
          {data?.skinType ? ` · ${data.skinType}` : ''}
        </p>
      </div>

      <div className="p-4">
        {!data || data.products.length === 0 ? (
          <div className="text-center py-5">
            <Users className="w-8 h-8 text-charcoal-200 mx-auto mb-2" />
            <p className="text-sm text-charcoal-500 font-body">
              {data?.userCount === 0
                ? t('community_no_users')
                : `${data?.userCount ?? 0} · —`}
            </p>
            <p className="text-xs text-charcoal-400 font-body mt-1">
              {t('community_be_early')}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-charcoal-400 font-body mb-3">
              Based on {data.userCount} user{data.userCount !== 1 ? 's' : ''} who reached {data.threshold}+
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

function BuildingCard({ t }: { t: TFn }) {
  return (
    <div className="bg-gradient-to-b from-white to-skin-50 border border-skin-100 rounded-3xl p-6 text-center">
      <div className="flex justify-center -space-x-2">
        <span className="w-9 h-9 rounded-full bg-skin-100 border-2 border-white flex items-center justify-center text-sm">🧴</span>
        <span className="w-9 h-9 rounded-full bg-sage-100 border-2 border-white flex items-center justify-center text-sm">✨</span>
        <span className="w-9 h-9 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-sm">💧</span>
      </div>
      <h3 className="font-display text-xl font-medium text-charcoal-900 mt-3">{t('foryou_community_building_title')}</h3>
      <p className="text-sm text-charcoal-500 font-body leading-relaxed mt-1.5">
        {t('foryou_community_building_body', { threshold: 75 })}
      </p>
      <div className="h-1.5 bg-skin-100 rounded-full mt-4 overflow-hidden">
        <div className="h-full w-[8%] bg-skin-400 rounded-full" />
      </div>
      <div className="flex gap-2 mt-3.5">
        <div className="flex-1 border border-dashed border-skin-200 rounded-xl p-2.5 text-left">
          <span className="block w-2.5 h-2.5 rounded-full bg-cream-400 mb-1.5" />
          <p className="text-xs font-semibold text-charcoal-800">{t('foryou_community_tier_label', { threshold: 75 })}</p>
          <p className="text-[11px] text-charcoal-400">{t('community_working_well')}</p>
        </div>
        <div className="flex-1 border border-dashed border-skin-200 rounded-xl p-2.5 text-left">
          <span className="block w-2.5 h-2.5 rounded-full bg-sage-400 mb-1.5" />
          <p className="text-xs font-semibold text-charcoal-800">{t('foryou_community_tier_label', { threshold: 80 })}</p>
          <p className="text-[11px] text-charcoal-400">{t('community_working_great')}</p>
        </div>
      </div>
      <p className="inline-flex items-center gap-1.5 bg-skin-100 text-skin-700 text-xs font-semibold px-3.5 py-2 rounded-full mt-4">
        <Sparkles className="w-3.5 h-3.5" />
        {t('foryou_community_first_tracker')}
      </p>
    </div>
  )
}

export default function CommunityPicks({ region }: { region?: string }) {
  const { t } = useLanguage()
  const [tier75, setTier75] = useState<TierData | null>(null)
  const [tier80, setTier80] = useState<TierData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/community-picks?threshold=75').then(r => r.json()).catch(() => null),
      fetch('/api/community-picks?threshold=80').then(r => r.json()).catch(() => null),
    ])
      .then(([d75, d80]) => {
        setTier75(d75)
        setTier80(d80)
      })
      .finally(() => setLoading(false))
  }, [])

  const isBuilding = !loading && (tier75?.userCount ?? 0) === 0 && (tier80?.userCount ?? 0) === 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-charcoal-500" />
        <h2 className="font-display text-xl font-light text-charcoal-900">{t('community_title')}</h2>
      </div>
      <p className="text-xs text-charcoal-500 font-body -mt-2">
        {t('community_subtitle')}
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
      ) : isBuilding ? (
        <BuildingCard t={t} />
      ) : (
        <>
          <Tier data={tier75} label={t('community_working_well')} badge="🟡" region={region} t={t} />
          <Tier data={tier80} label={t('community_working_great')} badge="🟢" region={region} t={t} />
        </>
      )}

      <p className="text-xs text-center text-charcoal-400 font-body pt-1">
        {t('community_footer')}
      </p>
    </div>
  )
}
