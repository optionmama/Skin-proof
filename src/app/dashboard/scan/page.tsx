import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AlertTriangle, Sparkles, TrendingUp, ChevronRight, Camera } from 'lucide-react'
import { scoreToLabel } from '@/lib/utils'

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
  const { data: { user } } = await supabase.auth.getUser()

  const { data: latestPhoto } = await supabase
    .from('skin_photos')
    .select('*')
    .eq('user_id', user!.id)
    .not('overall_skin_score', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

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
        <h1 className="font-display text-3xl font-light text-charcoal-900 mb-4">AI Skin Analysis</h1>
        <div className="bg-white rounded-2xl border border-skin-200 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-skin-100 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-7 h-7 text-skin-500" />
          </div>
          <h2 className="font-display text-2xl font-light text-charcoal-900 mb-2">No analysis yet</h2>
          <p className="text-charcoal-500 text-sm font-body mb-5">
            Upload a skin photo in your daily check-in to receive an AI analysis.
          </p>
          <Link
            href="/dashboard/checkin"
            className="inline-flex items-center gap-2 bg-skin-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-skin-600 transition-all"
          >
            <Camera className="w-4 h-4" />
            Start check-in
          </Link>
        </div>
      </div>
    )
  }

  const scoreDelta = previousPhoto
    ? (latestPhoto.overall_skin_score || 0) - (previousPhoto.overall_skin_score || 0)
    : null

  const { label: scoreLabel, color: scoreColor } = scoreToLabel(latestPhoto.overall_skin_score || 0)

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-3xl font-light text-charcoal-900">Skin Analysis</h1>
          <p className="text-charcoal-500 text-sm font-body">
            {latestPhoto.ai_analyzed_at
              ? new Date(latestPhoto.ai_analyzed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
              : new Date(latestPhoto.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/dashboard/checkin" className="flex items-center gap-1.5 text-sm text-skin-600 font-medium">
          <Camera className="w-4 h-4" />
          New
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
                Quality: {Math.round(latestPhoto.photo_quality_score)}%
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
            <p className="text-xs text-charcoal-500 mb-1 font-body">Overall skin score</p>
            <p className={`font-display text-2xl font-medium ${scoreColor}`}>{scoreLabel}</p>
            {scoreDelta !== null && (
              <p className={`text-sm font-body flex items-center gap-1 mt-1 ${
                scoreDelta > 0 ? 'text-sage-600' : scoreDelta < 0 ? 'text-skin-500' : 'text-charcoal-400'
              }`}>
                <TrendingUp className="w-3.5 h-3.5" />
                {scoreDelta > 0 ? '+' : ''}{scoreDelta.toFixed(1)} vs last scan
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div id="full-analysis" className="bg-white rounded-2xl border border-skin-100 p-5 mb-4 scroll-mt-4">
        <h2 className="font-display text-xl font-light text-charcoal-900 mb-4">Skin metrics</h2>
        <div className="space-y-4">
          {[
            { label: 'Hydration', value: latestPhoto.hydration_score, color: 'sage' },
            { label: 'Texture', value: latestPhoto.texture_score, color: 'skin' },
            { label: 'Pigmentation evenness', value: latestPhoto.pigmentation_score, color: 'cream' },
            { label: 'Redness (inverted)', value: latestPhoto.redness_score ? 100 - latestPhoto.redness_score : undefined, color: 'red' },
          ]
            .filter(m => m.value !== undefined && m.value !== null)
            .map(({ label, value, color }) => (
              <MetricBar key={label} label={label} value={value!} color={color} />
            ))
          }
        </div>
      </div>

      {/* Detected concerns */}
      {latestPhoto.detected_concerns && latestPhoto.detected_concerns.length > 0 && (
        <div className="bg-white rounded-2xl border border-skin-100 p-5 mb-4">
          <h2 className="font-display text-xl font-light text-charcoal-900 mb-3">Detected concerns</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {latestPhoto.detected_concerns.map(concern => (
              <span key={concern} className="bg-skin-100 text-skin-700 text-sm px-3 py-1.5 rounded-full font-medium capitalize">
                {concern.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Acne severity */}
      {latestPhoto.acne_severity && latestPhoto.acne_severity !== 'none' && (
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
              <p className="text-sm font-semibold text-charcoal-800 capitalize">
                {latestPhoto.acne_severity} acne detected
              </p>
              <p className="text-xs text-charcoal-600 font-body mt-1">
                AI tracking only. For treatment, consult a dermatologist.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI version note */}
      {latestPhoto.ai_analysis_version && (
        <p className="text-xs text-charcoal-400 text-center font-mono mb-4">
          Analysis: {latestPhoto.ai_analysis_version}
        </p>
      )}

      {/* View progress */}
      <div className="mb-4">
        <Link href="/dashboard/progress" className="flex items-center justify-center gap-2 bg-sage-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-sage-700 transition-colors">
          <TrendingUp className="w-4 h-4" />
          View progress over time
        </Link>
      </div>

      {/* Scan → next steps CTA */}
      {(() => {
        const mainConcern = latestPhoto.detected_concerns?.[0] || ''
        const today = new Date().toISOString().split('T')[0]
        const href = `/dashboard/recommendations?from=scan&concern=${encodeURIComponent(mainConcern)}&date=${today}`
        return (
          <div className="bg-gradient-to-br from-skin-50 to-cream-50 border border-skin-200 rounded-2xl p-5 mb-4">
            <p className="font-display text-lg font-medium text-charcoal-900 mb-1">What would you like to do next?</p>
            <p className="text-sm text-charcoal-600 font-body leading-relaxed mb-4">
              Based on today&apos;s scan, we&apos;ve checked if your routine suits your skin
              and prepared personalised recommendations.
            </p>
            <div className="space-y-2.5">
              <a
                href="#full-analysis"
                className="flex items-center justify-center gap-2 bg-white border border-skin-200 text-charcoal-800 py-3 rounded-xl font-medium hover:bg-skin-50 transition-colors text-sm"
              >
                📊 View today&apos;s full analysis
              </a>
              <Link
                href={href}
                className="flex items-center justify-center gap-2 bg-skin-500 text-white py-3.5 rounded-xl font-medium hover:bg-skin-600 transition-colors text-sm"
              >
                <Sparkles className="w-4 h-4" />
                See product recommendations →
              </Link>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
