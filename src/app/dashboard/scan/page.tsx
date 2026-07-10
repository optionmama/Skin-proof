import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AlertTriangle, Sparkles, TrendingUp, ChevronRight, Camera } from 'lucide-react'
import { cookies } from 'next/headers'
import { scoreToLabel, deriveScanConcerns, type ScanAnalysis } from '@/lib/utils'
import { dayKeyInTZ, formatDayInTZ, TZ_COOKIE } from '@/lib/day'
import { getT } from '@/lib/i18n/server'
import type { TranslationKey } from '@/lib/i18n/translations'
import DetectedConcerns from '@/components/DetectedConcerns'

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const { label, color } = scoreToLabel(score)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f2d5c7" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="#cc6b47" strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="font-display text-xl font-semibold text-charcoal-900">{Math.round(score)}</span>
      </div>
    </div>
  )
}

function MetricBar({ label, value, color = 'skin' }: { label: string; value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    skin: 'bg-skin-400',
    sage: 'bg-sage-400',
    cream: 'bg-cream-400',
    red: 'bg-red-400',
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-charcoal-700 font-body">{label}</span>
        <span className="text-sm font-medium text-charcoal-900 font-mono">{Math.round(value)}/100</span>
      </div>
      <div className="h-2 bg-skin-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorMap[color] || 'bg-skin-400'} rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default async function ScanPage() {
  const supabase = await createClient()
  const t = await getT()
  // Device timezone published by DashboardNav — dates on this SERVER page must
  // render in the USER's day, not the server's UTC day (2026-07-10 fix).
  const tz = (await cookies()).get(TZ_COOKIE)?.value
  const { data: { user } } = await supabase.auth.getUser()

  const { data: latestPhoto } = await supabase
    .from('skin_photos')
    .select('*')
    .eq('user_id', user!.id)
    .not('overall_skin_score', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Has the user checked in TODAY (their LOCAL day)? Drives the prominent
  // "scan today" banner below — opening the app onto yesterday's analysis with
  // only the tiny tab dot as a nudge was too easy to miss.
  const { data: todayCheckin } = await supabase
    .from('skin_checkins')
    .select('id')
    .eq('user_id', user!.id)
    .eq('checkin_date', dayKeyInTZ(tz))
    .limit(1)
    .maybeSingle()

  const { data: previousPhoto } = await supabase
    .from('skin_photos')
    .select('overall_skin_score, created_at')
    .eq('user_id', user!.id)
    .not('overall_skin_score', 'is', null)
    .order('created_at', { ascending: false })
    .range(1, 1)
    .single()

  const { data: photoUrl } = latestPhoto
    ? supabase.storage.from('skin-photos').getPublicUrl(latestPhoto.storage_path)
    : { data: null }

  if (!latestPhoto) {
    return (
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        <h1 className="font-display text-3xl font-light text-charcoal-900 mb-4">{t('scan_ai_title')}</h1>
        <div className="bg-white rounded-2xl border border-skin-200 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-skin-100 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-7 h-7 text-skin-500" />
          </div>
          <h2 className="font-display text-2xl font-light text-charcoal-900 mb-2">{t('scan_no_analysis')}</h2>
          <p className="text-charcoal-500 text-sm font-body mb-5">
            {t('scan_no_analysis_body')}
          </p>
          <Link
            href="/dashboard/checkin"
            className="inline-flex items-center gap-2 bg-skin-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-skin-600 transition-all"
          >
            <Camera className="w-4 h-4" />
            {t('scan_start_checkin')}
          </Link>
        </div>
      </div>
    )
  }

  const scoreDelta = previousPhoto
    ? (latestPhoto.overall_skin_score || 0) - (previousPhoto.overall_skin_score || 0)
    : null

  const { color: scoreColor } = scoreToLabel(latestPhoto.overall_skin_score || 0)
  // Localize the score label via i18n (the util returns English only); thresholds
  // match the result page so the same score reads the same in both places.
  const _score = latestPhoto.overall_skin_score || 0
  const scoreLabel = _score >= 80 ? t('result_excellent') : _score >= 65 ? t('result_good') : _score >= 50 ? t('result_fair') : t('result_needs_care')

  // Canonical concern set from THIS scan — the SAME call the For You page makes
  // (deriveScanConcerns on ai_analysis_raw), so both pages always name the same
  // concerns (e.g. 泛紅 / 痘痘). Localized via clabel_* for the primary tags; the
  // AI's free-text observations stay as supporting detail in the card.
  const scanRaw = latestPhoto.ai_analysis_raw as ScanAnalysis | null
  const scanConcerns = deriveScanConcerns(scanRaw)
  const concernLabels = scanConcerns.map((c) => t(`clabel_${c}` as TranslationKey))

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* "You haven't scanned today" banner — only when today's (local-day)
          check-in doesn't exist yet. The analysis below is yesterday's; without
          this the only nudge was the small red dot on the tab. */}
      {!todayCheckin && (
        <Link href="/dashboard/checkin"
          className="flex items-center gap-3 bg-gradient-to-r from-skin-500 to-skin-400 text-white rounded-2xl p-4 mb-4 active:scale-[0.99] transition-all">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{t('scan_today_pending')}</p>
            <p className="text-xs text-white/85 font-body">{t('scan_today_pending_cta')}</p>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0" />
        </Link>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-3xl font-light text-charcoal-900">{t('scan_title')}</h1>
          <p className="text-charcoal-500 text-sm font-body">
            {formatDayInTZ(latestPhoto.ai_analyzed_at || latestPhoto.created_at, tz)}
          </p>
        </div>
        <Link href="/dashboard/checkin" className="flex items-center gap-1.5 text-sm text-skin-600 font-medium">
          <Camera className="w-4 h-4" />
          {t('scan_new')}
        </Link>
      </div>

      {/* Photo + Score */}
      <div className="bg-white rounded-2xl border border-skin-100 overflow-hidden mb-4">
        {photoUrl?.publicUrl && (
          <div className="relative">
            <img
              src={photoUrl.publicUrl}
              alt="Analysed skin photo"
              className="w-full h-56 object-cover"
            />
            {/* Quality badge */}
            {latestPhoto.photo_quality_score && (
              <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md ${
                latestPhoto.photo_quality_score >= 70
                  ? 'bg-sage-600/80 text-white'
                  : 'bg-amber-500/80 text-white'
              }`}>
                {t('scan_quality')}: {Math.round(latestPhoto.photo_quality_score)}%
              </div>
            )}
            {latestPhoto.quality_flags && latestPhoto.quality_flags.length > 0 && (
              <div className="absolute bottom-3 left-3 flex gap-1.5">
                {latestPhoto.quality_flags.map(flag => (
                  <span key={flag} className="bg-amber-500/80 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur">
                    ⚠ {flag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Overall score */}
        <div className="p-5 flex items-center gap-5">
          <ScoreRing score={latestPhoto.overall_skin_score || 0} size={88} />
          <div>
            <p className="text-xs text-charcoal-500 mb-1 font-body">{t('scan_overall_score')}</p>
            <p className={`font-display text-2xl font-medium ${scoreColor}`}>{scoreLabel}</p>
            {scoreDelta !== null && (
              <p className={`text-sm font-body flex items-center gap-1 mt-1 ${
                scoreDelta > 0 ? 'text-sage-600' : scoreDelta < 0 ? 'text-skin-500' : 'text-charcoal-400'
              }`}>
                <TrendingUp className="w-3.5 h-3.5" />
                {scoreDelta > 0 ? '+' : ''}{scoreDelta.toFixed(1)} {t('scan_vs_last')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div id="full-analysis" className="bg-white rounded-2xl border border-skin-100 p-5 mb-4 scroll-mt-4">
        <h2 className="font-display text-xl font-light text-charcoal-900 mb-4">{t('scan_metrics')}</h2>
        <div className="space-y-4">
          {[
            { label: `💧 ${t('dim_hydration')}`, value: latestPhoto.hydration_score, color: 'sage' },
            { label: `✨ ${t('scan_metric_texture')}`, value: latestPhoto.texture_score, color: 'skin' },
            { label: `🎨 ${t('scan_metric_pigmentation')}`, value: latestPhoto.pigmentation_score, color: 'cream' },
            { label: `🌿 ${t('scan_metric_redness')}`, value: latestPhoto.redness_score ? 100 - latestPhoto.redness_score : undefined, color: 'red' },
          ]
            .filter(m => m.value !== undefined && m.value !== null)
            .map(({ label, value, color }) => (
              <MetricBar key={label} label={label} value={value!} color={color} />
            ))
          }
        </div>
      </div>

      {/* Detected concerns — canonical tags (identical set to For You) up top,
          with the AI's specific free-text observations as supporting detail. */}
      {(scanConcerns.length > 0 || (latestPhoto.detected_concerns && latestPhoto.detected_concerns.length > 0)) && (
        <DetectedConcerns concernLabels={concernLabels} observations={latestPhoto.detected_concerns || []} />
      )}

      {/* Acne severity — only when acne is an actual detected concern (i.e. the
          AI's observations describe inflammatory acne, not just 粉刺/blackheads)
          AND severity is present. Gating on scanConcerns keeps this card in sync
          with the tags above, so we never show a 痘痘 card when 痘痘 isn't a tag. */}
      {scanConcerns.includes('acne') && ['mild', 'moderate', 'severe'].includes(latestPhoto.acne_severity || '') && (
        <div className={`rounded-2xl border p-4 mb-4 ${
          latestPhoto.acne_severity === 'severe' ? 'bg-red-50 border-red-200' :
          latestPhoto.acne_severity === 'moderate' ? 'bg-amber-50 border-amber-200' :
          'bg-cream-50 border-cream-200'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
              latestPhoto.acne_severity === 'severe' ? 'text-red-500' :
              latestPhoto.acne_severity === 'moderate' ? 'text-amber-500' : 'text-cream-500'
            }`} />
            <div>
              <p className="text-sm font-semibold text-charcoal-800">
                {t('scan_acne_detected', { severity:
                  latestPhoto.acne_severity === 'mild' ? t('acne_mild')
                  : latestPhoto.acne_severity === 'moderate' ? t('acne_moderate')
                  : latestPhoto.acne_severity === 'severe' ? t('acne_severe')
                  : latestPhoto.acne_severity })}
              </p>
              <p className="text-xs text-charcoal-600 font-body mt-1">
                {t('scan_acne_note')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI version note */}
      {latestPhoto.ai_analysis_version && (
        <p className="text-xs text-charcoal-400 text-center font-mono mb-4">
          {t('scan_analysis_label')}: {latestPhoto.ai_analysis_version}
        </p>
      )}

      {/* View progress */}
      <div className="mb-4">
        <Link href="/dashboard/progress" className="flex items-center justify-center gap-2 bg-sage-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-sage-700 transition-colors">
          <TrendingUp className="w-4 h-4" />
          {t('scan_view_progress')}
        </Link>
      </div>

      {/* Scan → next steps CTA */}
      {(() => {
        // Pass the first CANONICAL concern (e.g. 'redness'), not the raw free-text
        // observation — For You can clabel it correctly and it matches the tags above.
        // (The old `date` param was the server's UTC day and is unused by For You —
        // it derives the scan date from the latest photo itself — so it's dropped.)
        const mainConcern = scanConcerns[0] || ''
        const href = `/dashboard/recommendations?from=scan&concern=${encodeURIComponent(mainConcern)}`
        return (
          <div className="bg-gradient-to-br from-skin-50 to-cream-50 border border-skin-200 rounded-2xl p-5 mb-4">
            <p className="font-display text-lg font-medium text-charcoal-900 mb-1">{t('scan_next_title')}</p>
            <p className="text-sm text-charcoal-600 font-body leading-relaxed mb-4">
              {t('scan_next_body')}
            </p>
            <div className="space-y-2.5">
              <Link
                href={href}
                className="flex items-center justify-center gap-2 bg-skin-500 text-white py-3.5 rounded-xl font-medium hover:bg-skin-600 transition-colors text-sm"
              >
                <Sparkles className="w-4 h-4" />
                {t('scan_see_recs')}
              </Link>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
