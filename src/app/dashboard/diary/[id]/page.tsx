'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Star, Calendar, DollarSign, Trash2, Edit2, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'

const REACTION_COLORS: Record<string, string> = {
  none: 'text-sage-700 bg-sage-100',
  breakout: 'text-red-700 bg-red-100',
  redness: 'text-orange-700 bg-orange-100',
  dryness: 'text-amber-700 bg-amber-100',
  irritation: 'text-red-700 bg-red-100',
  purging: 'text-purple-700 bg-purple-100',
  improved: 'text-skin-700 bg-skin-100',
  hydrating: 'text-blue-700 bg-blue-100',
}

interface ProductLog {
  id: string
  user_rating: number | null
  usage_frequency: string | null
  skin_reaction: string | null
  notes: string | null
  purchase_price: number | null
  started_using_at: string | null
  stopped_using_at: string | null
  created_at: string
  products: {
    id: string
    name: string
    brand: string
    category: string
    is_verified: boolean
    cruelty_free: boolean
    vegan: boolean
    fragrance_free: boolean
  } | null
}

export default function DiaryEntryPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()
  const id = params.id as string

  const [log, setLog] = useState<ProductLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [stopping, setStopping] = useState(false)

  useEffect(() => {
    const fetchLog = async () => {
      const { data } = await supabase
        .from('user_product_logs')
        .select('*, products(id, name, brand, category, is_verified, cruelty_free, vegan, fragrance_free)')
        .eq('id', id)
        .single()
      setLog(data)
      setLoading(false)
    }
    fetchLog()
  }, [id])

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await supabase.from('user_product_logs').delete().eq('id', id)
    router.push('/dashboard/diary')
  }

  const handleStopUsing = async () => {
    setStopping(true)
    await supabase
      .from('user_product_logs')
      .update({ stopped_using_at: new Date().toISOString().split('T')[0] })
      .eq('id', id)
    setLog((prev) => prev ? { ...prev, stopped_using_at: new Date().toISOString().split('T')[0] } : prev)
    setStopping(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-charcoal-400 text-sm">{t('diary_loading')}</div>
      </div>
    )
  }

  if (!log) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-charcoal-500">{t('diary_entry_not_found')}</p>
          <Link href="/dashboard/diary" className="text-skin-600 text-sm hover:underline">{t('diary_back')}</Link>
        </div>
      </div>
    )
  }

  const product = log.products
  const daysUsed = log.started_using_at
    ? Math.ceil((new Date().getTime() - new Date(log.started_using_at).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const reactionColor = log.skin_reaction ? REACTION_COLORS[log.skin_reaction] : null

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="bg-cream/80 backdrop-blur-sm border-b border-skin-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard/diary" className="p-2 hover:bg-skin-50 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-charcoal-600" />
          </Link>
          <h1 className="font-display text-xl text-charcoal-800 flex-1">{t('diary_product_log')}</h1>
          <Link
            href={`/dashboard/diary/${id}/edit`}
            className="p-2 hover:bg-skin-50 rounded-xl transition-colors"
          >
            <Edit2 size={18} className="text-charcoal-500" />
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Product card */}
        <div className="bg-white border border-skin-100 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-skin-50 flex items-center justify-center text-2xl flex-shrink-0">
              🧴
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-xl text-charcoal-800">{product?.name}</h2>
                {product?.is_verified && (
                  <span className="text-[10px] bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} /> {t('diary_verified')}
                  </span>
                )}
              </div>
              <p className="text-sm text-charcoal-500 mt-0.5">{product?.brand}</p>
              <p className="text-xs text-charcoal-400 capitalize">{product?.category?.replace(/_/g, ' ')}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {product?.cruelty_free && (
                  <span className="text-[10px] bg-sage-50 text-sage-600 px-2 py-0.5 rounded-full border border-sage-200">🐰 {t('badge_cruelty_free')}</span>
                )}
                {product?.vegan && (
                  <span className="text-[10px] bg-sage-50 text-sage-600 px-2 py-0.5 rounded-full border border-sage-200">🌱 {t('badge_vegan')}</span>
                )}
                {product?.fragrance_free && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">🌸 {t('badge_fragrance_free')}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {log.user_rating && (
            <div className="bg-white border border-skin-100 rounded-2xl p-4 space-y-1">
              <p className="text-xs text-charcoal-400 font-medium">{t('diary_your_rating')}</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < log.user_rating! ? 'text-amber-400 fill-amber-400' : 'text-charcoal-200'}
                  />
                ))}
              </div>
              <p className="text-xs text-charcoal-500">
                {t(`rating_${log.user_rating}` as TranslationKey)}
              </p>
            </div>
          )}

          {daysUsed !== null && (
            <div className="bg-white border border-skin-100 rounded-2xl p-4 space-y-1">
              <p className="text-xs text-charcoal-400 font-medium">{t('diary_days_used')}</p>
              <p className="text-2xl font-display text-charcoal-800">{daysUsed}</p>
              <p className="text-xs text-charcoal-500">
                {log.stopped_using_at ? t('diary_discontinued') : t('diary_counting')}
              </p>
            </div>
          )}

          {log.usage_frequency && (
            <div className="bg-white border border-skin-100 rounded-2xl p-4 space-y-1">
              <p className="text-xs text-charcoal-400 font-medium flex items-center gap-1">
                <Calendar size={11} /> {t('diary_usage')}
              </p>
              <p className="text-sm font-semibold text-charcoal-800">{t(`usage_${log.usage_frequency}` as TranslationKey)}</p>
            </div>
          )}

          {log.purchase_price && (
            <div className="bg-white border border-skin-100 rounded-2xl p-4 space-y-1">
              <p className="text-xs text-charcoal-400 font-medium flex items-center gap-1">
                <DollarSign size={11} /> {t('diary_price_paid')}
              </p>
              <p className="text-sm font-semibold text-charcoal-800">${log.purchase_price.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Skin reaction */}
        {reactionColor && log.skin_reaction && (
          <div className="bg-white border border-skin-100 rounded-2xl p-5 space-y-2">
            <p className="text-xs text-charcoal-400 font-medium">{t('diary_skin_reaction')}</p>
            <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${reactionColor}`}>
              {t(`reaction_${log.skin_reaction}` as TranslationKey)}
            </span>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white border border-skin-100 rounded-2xl p-5 space-y-3">
          <p className="text-xs text-charcoal-400 font-medium">{t('diary_timeline')}</p>
          <div className="space-y-2">
            {log.started_using_at && (
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">{t('diary_started')}</span>
                <span className="text-charcoal-800 font-medium">
                  {new Date(log.started_using_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
            {log.stopped_using_at && (
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">{t('diary_stopped')}</span>
                <span className="text-charcoal-800 font-medium">
                  {new Date(log.stopped_using_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {log.notes && (
          <div className="bg-white border border-skin-100 rounded-2xl p-5 space-y-2">
            <p className="text-xs text-charcoal-400 font-medium">{t('diary_your_notes')}</p>
            <p className="text-sm text-charcoal-700 leading-relaxed">{log.notes}</p>
          </div>
        )}

        {/* View prices link */}
        {product && (
          <Link
            href={`/dashboard/prices/${product.id}`}
            className="block w-full py-3 text-center bg-skin-50 border border-skin-200 text-skin-700 font-medium text-sm rounded-2xl hover:bg-skin-100 transition-colors"
          >
            {t('diary_compare_prices')}
          </Link>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {!log.stopped_using_at && (
            <button
              onClick={handleStopUsing}
              disabled={stopping}
              className="w-full py-3 border border-charcoal-200 text-charcoal-600 font-medium text-sm rounded-2xl hover:bg-charcoal-50 transition-colors disabled:opacity-50"
            >
              {stopping ? t('diary_saving') : t('diary_mark_discontinued')}
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`w-full py-3 font-medium text-sm rounded-2xl transition-colors ${
              confirmDelete
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'border border-red-200 text-red-500 hover:bg-red-50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Trash2 size={14} />
              {deleting ? t('diary_deleting') : confirmDelete ? t('diary_confirm_delete') : t('diary_delete_entry')}
            </span>
          </button>
          {confirmDelete && (
            <button onClick={() => setConfirmDelete(false)} className="w-full text-center text-xs text-charcoal-400 hover:text-charcoal-600">
              {t('general_cancel')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
