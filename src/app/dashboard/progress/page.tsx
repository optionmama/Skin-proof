'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import type { SkinCheckin, SkinPhoto } from '@/types/database'
import { useLanguage } from '@/lib/i18n/LanguageContext'

type Period = '14d' | '30d' | '90d'

export default function ProgressPage() {
  const supabase = createClient()
  const { t } = useLanguage()
  const [period, setPeriod] = useState<Period>('30d')
  const [checkins, setCheckins] = useState<SkinCheckin[]>([])
  const [photos, setPhotos] = useState<SkinPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [compareA, setCompareA] = useState<SkinPhoto | null>(null)
  const [compareB, setCompareB] = useState<SkinPhoto | null>(null)

  useEffect(() => { loadData() }, [period])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const days = period === '14d' ? 14 : period === '30d' ? 30 : 90
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    const fromStr = fromDate.toISOString().split('T')[0]

    const [{ data: ci }, { data: ph }] = await Promise.all([
      supabase.from('skin_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('checkin_date', fromStr)
        .order('checkin_date'),
      supabase.from('skin_photos')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: false }),
    ])

    setCheckins(ci || [])
    setPhotos(ph || [])
    setLoading(false)
  }

  // Chart data — only uses fields that still exist in checkin
  const chartData = checkins.map(ci => {
    const dayPhoto = photos.find(p => p.created_at.startsWith(ci.checkin_date))
    return {
      date: formatShortDate(ci.checkin_date),
      skinScore: dayPhoto?.overall_skin_score ?? null,
      hydration: dayPhoto?.hydration_score ?? null,
      redness: dayPhoto?.redness_score ?? null,
      stress: ci.stress_level ?? null,
      sleep: ci.sleep_hours ?? null,
      water: ci.water_intake_ml ? Math.round(ci.water_intake_ml / 100) / 10 : null,
    }
  })

  // Trend helper
  const trend = (key: keyof typeof chartData[0]) => {
    const vals = chartData.map(d => d[key]).filter(v => v !== null) as number[]
    if (vals.length < 2) return null
    const recent = vals.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, vals.length)
    const earlier = vals.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, vals.length)
    return recent - earlier
  }

  const TrendIcon = ({ value }: { value: number | null }) => {
    if (value === null) return <Minus className="w-3.5 h-3.5 text-charcoal-400" />
    if (value > 3) return <TrendingUp className="w-3.5 h-3.5 text-sage-500" />
    if (value < -3) return <TrendingDown className="w-3.5 h-3.5 text-skin-500" />
    return <Minus className="w-3.5 h-3.5 text-charcoal-400" />
  }

  const photosWithScore = photos.filter(p => p.overall_skin_score !== null)
  const avgSkinScore = photosWithScore.length
    ? Math.round(photosWithScore.reduce((s, p) => s + (p.overall_skin_score || 0), 0) / photosWithScore.length)
    : null

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from('skin-photos').getPublicUrl(path)
    return data.publicUrl
  }

  const handlePhotoSelect = (photo: SkinPhoto) => {
    if (!compareA) { setCompareA(photo); return }
    if (!compareB && photo.id !== compareA.id) { setCompareB(photo); return }
    // reset
    setCompareA(photo)
    setCompareB(null)
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-sage-600'
    if (score >= 60) return 'text-skin-500'
    return 'text-red-500'
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="mb-5">
        <h1 className="font-display text-3xl font-light text-charcoal-900">{t('progress_title')}</h1>
        <p className="text-charcoal-500 text-sm font-body">{t('progress_checkins_tracked', { n: checkins.length })}</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 bg-skin-100 rounded-xl p-1 mb-5">
        {(['14d', '30d', '90d'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              period === p ? 'bg-white text-charcoal-900 shadow-sm' : 'text-charcoal-500'
            }`}
          >
            {p === '14d' ? '14d' : p === '30d' ? '30d' : '90d'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      ) : checkins.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-display text-xl font-light text-charcoal-700 mb-2">{t('progress_no_data')}</p>
          <p className="text-charcoal-500 text-sm font-body">{t('progress_no_data_body')}</p>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: t('progress_avg_score'), value: avgSkinScore ? `${avgSkinScore}` : '—', trendKey: 'skinScore' as const, unit: '/100' },
              { label: t('progress_photos_taken'), value: `${photos.length}`, trendKey: null, unit: '' },
              { label: t('progress_avg_sleep'), value: checkins.length ? `${(checkins.reduce((s, c) => s + (c.sleep_hours || 0), 0) / checkins.length).toFixed(1)}` : '—', trendKey: 'sleep' as const, unit: 'h' },
              { label: t('progress_checkins'), value: `${checkins.length}`, trendKey: null, unit: '' },
            ].map(({ label, value, trendKey, unit }) => (
              <div key={label} className="bg-white rounded-xl border border-skin-100 p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-charcoal-500 font-body">{label}</p>
                  <TrendIcon value={trendKey ? trend(trendKey) : null} />
                </div>
                <p className="font-display text-2xl font-light text-charcoal-900">
                  {value}<span className="text-sm text-charcoal-400 font-body">{unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* AI Skin Score chart */}
          {photosWithScore.length > 1 && (
            <div className="bg-white rounded-2xl border border-skin-100 p-5 mb-4">
              <h2 className="font-display text-xl font-light text-charcoal-900 mb-4">{t('progress_score_trend')}</h2>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData.filter(d => d.skinScore !== null)}>
                  <defs>
                    <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#cc6b47" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#cc6b47" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f2d5c7" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7d6b64' }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#7d6b64' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #f2d5c7', fontSize: '12px' }}
                    formatter={(v: number) => [`${v}/100`, 'Skin Score']}
                  />
                  <Area type="monotone" dataKey="skinScore" stroke="#cc6b47" strokeWidth={2} fill="url(#skinGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sleep & Stress chart */}
          <div className="bg-white rounded-2xl border border-skin-100 p-5 mb-4">
            <h2 className="font-display text-xl font-light text-charcoal-900 mb-4">{t('progress_sleep_stress')}</h2>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f2d5c7" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7d6b64' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#7d6b64' }} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #f2d5c7', fontSize: '12px' }} />
                <Line type="monotone" dataKey="sleep" stroke="#6f8362" strokeWidth={2} dot={false} name="Sleep (hrs)" />
                <Line type="monotone" dataKey="stress" stroke="#cc6b47" strokeWidth={2} dot={false} name="Stress /10" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-center">
              {[['#6f8362', 'Sleep (hrs)'], ['#cc6b47', 'Stress /10']].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
                  <span className="text-xs text-charcoal-500 font-body">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Photo timeline */}
          {photos.length > 0 && (
            <div className="bg-white rounded-2xl border border-skin-100 p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xl font-light text-charcoal-900">{t('progress_photo_timeline')}</h2>
                {(compareA || compareB) && (
                  <button
                    onClick={() => { setCompareA(null); setCompareB(null) }}
                    className="text-xs text-charcoal-400 hover:text-charcoal-600"
                  >
                    {t('progress_clear')}
                  </button>
                )}
              </div>
              <p className="text-xs text-charcoal-400 font-body mb-3">
                {!compareA ? t('progress_tap_compare') : !compareB ? t('progress_tap_another') : t('progress_comparing')}
              </p>

              {/* Compare view */}
              {compareA && compareB && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[compareA, compareB].map((photo, i) => (
                    <div key={photo.id} className="relative">
                      <img
                        src={getPhotoUrl(photo.storage_path)}
                        alt={`Compare ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-xl"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl p-2">
                        <p className="text-white text-xs font-body">
                          {new Date(photo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        {photo.overall_skin_score && (
                          <p className="text-white text-sm font-medium">{photo.overall_skin_score}/100</p>
                        )}
                      </div>
                      <div className="absolute top-2 left-2 bg-white/90 rounded-full px-2 py-0.5 text-xs font-medium text-charcoal-700">
                        {i === 0 ? t('progress_before') : t('progress_after')}
                      </div>
                    </div>
                  ))}
                  {/* Score delta */}
                  {compareA.overall_skin_score && compareB.overall_skin_score && (
                    <div className="col-span-2 bg-skin-50 rounded-xl p-3 text-center">
                      <span className="text-sm text-charcoal-600 font-body">{t('progress_score_change_label')}</span>
                      <span className={`text-sm font-semibold ${
                        (compareB.overall_skin_score - compareA.overall_skin_score) >= 0
                          ? 'text-sage-600' : 'text-skin-500'
                      }`}>
                        {compareB.overall_skin_score - compareA.overall_skin_score >= 0 ? '+' : ''}
                        {compareB.overall_skin_score - compareA.overall_skin_score}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-2">
                {photos.map(photo => {
                  const isSelected = photo.id === compareA?.id || photo.id === compareB?.id
                  return (
                    <div
                      key={photo.id}
                      className={`relative cursor-pointer rounded-xl overflow-hidden aspect-square ${
                        isSelected ? 'ring-2 ring-skin-500' : ''
                      }`}
                      onClick={() => handlePhotoSelect(photo)}
                    >
                      <img
                        src={getPhotoUrl(photo.storage_path)}
                        alt="Skin photo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                        <p className="text-white text-[10px] font-body leading-none">
                          {new Date(photo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        {photo.overall_skin_score ? (
                          <p className={`text-xs font-semibold ${scoreColor(photo.overall_skin_score)} brightness-150`}>
                            {photo.overall_skin_score}
                          </p>
                        ) : (
                          <p className="text-white/60 text-[10px]">—</p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-skin-500 flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">
                            {photo.id === compareA?.id ? 'A' : 'B'}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tip */}
          <div className="bg-sage-50 border border-sage-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-sage-800 mb-1">{t('progress_tip')}</p>
            <p className="text-xs text-sage-700 font-body leading-relaxed">
              {t('progress_tip_body')}
            </p>
          </div>

          {/* Periodic Reports */}
          <SkinReports checkinCount={checkins.length} />
        </>
      )}
    </div>
  )
}

function SkinReports({ checkinCount }: { checkinCount: number }) {
  const { t } = useLanguage()
  const PERIODS = [
    { days: 14 as const, label: t('progress_report_14d'), icon: '📊', needed: 14 },
    { days: 30 as const, label: t('progress_report_30d'), icon: '📈', needed: 30 },
    { days: 90 as const, label: t('progress_report_90d'), icon: '🏆', needed: 90 },
  ]

  return (
    <div className="mt-2">
      <h2 className="font-display text-xl font-light text-charcoal-900 mb-3">{t('progress_reports')}</h2>
      <div className="space-y-2">
        {PERIODS.map(({ days, label, icon, needed }) => {
          const unlocked = checkinCount >= needed
          return (
            <div key={days} className={`bg-white rounded-xl border p-4 flex items-center justify-between ${unlocked ? 'border-skin-200' : 'border-skin-100 opacity-70'}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{unlocked ? icon : '🔒'}</span>
                <div>
                  <p className="text-sm font-medium text-charcoal-800">{label}</p>
                  {unlocked ? (
                    <p className="text-xs text-charcoal-400 font-body">AI analysis of your {days}-day journey</p>
                  ) : (
                    <p className="text-xs text-charcoal-400 font-body">
                      {t('progress_locked', { needed: needed - checkinCount })}
                      <span className="ml-1 text-charcoal-300">({checkinCount}/{needed})</span>
                    </p>
                  )}
                </div>
              </div>
              {unlocked ? (
                <a href={`/dashboard/progress/report?period=${days}`}
                  className="text-xs text-skin-600 font-medium border border-skin-300 px-3 py-1.5 rounded-lg hover:bg-skin-50 transition-colors">
                  {t('progress_view_short')}
                </a>
              ) : (
                <div className="w-10 h-2.5 bg-skin-100 rounded-full overflow-hidden">
                  <div className="h-full bg-skin-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (checkinCount / needed) * 100)}%` }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
