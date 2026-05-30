'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Home, BookOpen, TrendingUp, Loader2, Sparkles, AlertCircle, Users } from 'lucide-react'

const COMEDOGENIC = ['coconut oil', 'lanolin', 'cocoa butter', 'isopropyl myristate', 'mineral oil', 'wheat germ oil']
const HEAVY       = ['petrolatum', 'dimethicone', 'shea butter']
const IRRITANTS   = ['fragrance', 'alcohol denat', 'sodium lauryl sulfate', 'menthol', 'eucalyptus']

// Legacy arrays kept for checkProducts function
const COMEDOGENIC_INGREDIENTS = [...COMEDOGENIC, 'algae extract', 'flaxseed oil', 'acetylated lanolin']

type MainConcern = 'redness' | 'breakouts' | 'dryness' | 'oiliness' | 'pores' | 'none'

function getTip(mainConcern: MainConcern, overallScore: number) {
  if (overallScore >= 80) return {
    emoji: '🌟', message: 'Your skin looks great today!',
    tip: 'Keep up your current routine — it\'s working.',
  }
  const tips: Record<MainConcern, { emoji: string; message: string; tip: string }> = {
    breakouts: { emoji: '🫧', message: 'Some breakouts detected today.', tip: 'Avoid touching your face. Check if you recently added any new products to your routine.' },
    dryness:   { emoji: '💧', message: 'Your skin looks a bit dehydrated.', tip: 'Drink more water today. Tonight, apply hydrating toner before your moisturiser.' },
    oiliness:  { emoji: '✨', message: 'T-zone is looking oily today.', tip: 'Try blotting this afternoon. Skip heavy cream tonight and use a lighter moisturiser.' },
    redness:   { emoji: '🌿', message: 'Some redness detected.', tip: 'Use gentle, fragrance-free products today. Avoid exfoliating.' },
    pores:     { emoji: '🔍', message: 'Pores appear more visible today.', tip: 'Make sure you\'re double-cleansing and using a BHA toner a few times a week.' },
    none:      { emoji: '💚', message: 'Skin barrier looks healthy!', tip: 'No major concerns today — just maintain your routine.' },
  }
  return tips[mainConcern] || tips.none
}

function ScoreRing({ score }: { score: number }) {
  const size = 96
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color = score >= 80 ? '#6f8362' : score >= 60 ? '#cc6b47' : '#dc2626'
  const label = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Needs care'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f2d5c7" strokeWidth="6" />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-2xl font-semibold text-charcoal-900">{Math.round(score)}</span>
        </div>
      </div>
      <span className="text-sm font-medium" style={{ color }}>{label}</span>
    </div>
  )
}

function DimensionBar({ label, value, inverted = false }: { label: string; value: number; inverted?: boolean }) {
  const display = inverted ? 100 - value : value
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-charcoal-600">{label}</span>
        <span className="font-mono text-charcoal-700">{Math.round(display)}</span>
      </div>
      <div className="h-1.5 bg-skin-100 rounded-full overflow-hidden">
        <div className="h-full bg-skin-400 rounded-full transition-all duration-700"
          style={{ width: `${display}%` }} />
      </div>
    </div>
  )
}

function ResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const checkinId = searchParams.get('checkin_id')

  const [analysis, setAnalysis] = useState<{
    overall_score: number
    dimensions: Record<string, number>
    main_concern: MainConcern
    visible_observations: string[]
    makeup_detected: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [comedogenicAlerts, setComedogenicAlerts] = useState<{ name: string; flag: string }[]>([])
  const [routineProducts, setRoutineProducts] = useState<{ name: string; brand: string; notes: string; flag?: string; flagType?: string }[]>([])
  const [noProducts, setNoProducts] = useState(false)
  const [checkinCount, setCheckinCount] = useState(1)

  useEffect(() => {
    if (!checkinId) { router.replace('/dashboard'); return }
    loadData()
  }, [checkinId])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get total checkin count
    const { count } = await supabase
      .from('skin_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    setCheckinCount(count || 1)

    // Poll for the latest analyzed photo (analysis runs async)
    let attempts = 0
    const poll = async () => {
      const { data: photoData } = await supabase
        .from('skin_photos')
        .select('ai_analysis_raw, overall_skin_score, main_concern, visible_observations, makeup_detected')
        .eq('user_id', user.id)
        .not('overall_skin_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (photoData?.overall_skin_score) {
        const raw = photoData.ai_analysis_raw as Record<string, unknown> | null
        setAnalysis({
          overall_score: photoData.overall_skin_score || (raw?.overall_score as number) || 70,
          dimensions: (raw?.dimensions as Record<string, number>) || {},
          // prefer dedicated column, fall back to raw JSON
          main_concern: (photoData.main_concern as MainConcern)
            || (raw?.main_concern as MainConcern)
            || 'none',
          visible_observations: (photoData.visible_observations as string[])
            || (raw?.visible_observations as string[])
            || [],
          makeup_detected: photoData.makeup_detected ?? Boolean(raw?.makeup_detected),
        })
        const dimensions = (raw?.dimensions as Record<string, number>) || {}
        setLoading(false)
        const concern = (photoData.main_concern as MainConcern)
          || (raw?.main_concern as MainConcern)
          || 'none'
        checkProducts(user.id, concern, dimensions)
      } else if (attempts < 8) {
        attempts++
        setTimeout(poll, 2500)
      } else {
        setLoading(false)
        checkProducts(user.id, 'none', {})
      }
    }
    poll()
  }

  const checkProducts = async (userId: string, mainConcern: MainConcern, dims: Record<string, number>) => {
    const { data: routines } = await supabase
      .from('user_routines')
      .select('user_products(name, brand, notes)')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (!routines || routines.length === 0) {
      setNoProducts(true)
      return
    }

    const oilinessBad  = (dims.oiliness  || 0) > 60
    const breakoutsBad = (dims.breakouts || 0) > 60
    const rednessBad   = (dims.redness   || 0) > 60

    // Deduplicate by brand+name
    const seen = new Set<string>()
    const products: { name: string; brand: string; notes: string; flag?: string; flagType?: string }[] = []
    const alerts: { name: string; flag: string }[] = []

    for (const r of routines) {
      const p = r.user_products as { name?: string; brand?: string; notes?: string } | null
      if (!p?.name) continue
      const key = `${(p.brand||'').toLowerCase()}|${p.name.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)

      const notesLower = (p.notes || '').toLowerCase()
      let flag: string | undefined
      let flagType: string | undefined

      if ((oilinessBad || breakoutsBad) && !flag) {
        const hit = [...COMEDOGENIC, ...HEAVY].find(c => notesLower.includes(c))
        if (hit) { flag = hit; flagType = 'pores' }
      }
      if (rednessBad && !flag) {
        const hit = IRRITANTS.find(c => notesLower.includes(c))
        if (hit) { flag = hit; flagType = 'redness' }
      }

      if (flag) alerts.push({ name: p.name, flag })
      products.push({ name: p.name, brand: p.brand || '', notes: p.notes || '', flag, flagType })
    }

    setComedogenicAlerts(alerts)
    setRoutineProducts(products)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-skin-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-skin-500 animate-spin" />
        </div>
        <p className="font-display text-xl font-light text-charcoal-800">AI is analysing your skin…</p>
        <p className="text-sm text-charcoal-500 font-body">This takes about 10 seconds</p>
      </div>
    )
  }

  const tip = getTip(analysis?.main_concern || 'none', analysis?.overall_score || 70)
  const dims = analysis?.dimensions || {}

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div>
        <p className="text-xs text-charcoal-500 font-body">Day {checkinCount} of your journey</p>
        <h1 className="font-display text-3xl font-light text-charcoal-900">Today&apos;s Skin ✨</h1>
      </div>

      {/* Score card */}
      {analysis && (
        <div className="bg-white rounded-2xl border border-skin-100 p-5">
          <div className="flex items-center gap-6 mb-4">
            <ScoreRing score={analysis.overall_score} />
            <div className="flex-1 space-y-3">
              {Object.keys(dims).length > 0 && (
                <>
                  <DimensionBar label="Hydration"  value={dims.hydration || 50} />
                  <DimensionBar label="Clarity"    value={dims.breakouts || 50} inverted />
                  <DimensionBar label="Calmness"   value={dims.redness   || 50} inverted />
                  <DimensionBar label="Balance"    value={dims.oiliness  || 50} inverted />
                </>
              )}
            </div>
          </div>

          {analysis.makeup_detected && (
            <p className="text-xs text-charcoal-400 font-body italic">
              💄 Makeup detected — score based on visible skin areas
            </p>
          )}

          {analysis.visible_observations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-skin-50">
              <p className="text-xs font-semibold text-charcoal-600 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-skin-500" /> What I noticed
              </p>
              <ul className="space-y-1">
                {analysis.visible_observations.map((obs, i) => (
                  <li key={i} className="text-xs text-charcoal-600 font-body flex gap-1.5">
                    <span className="text-skin-400 shrink-0">•</span>{obs}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Daily tip card */}
      <div className="bg-skin-50 border border-skin-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">{tip.emoji}</span>
          <div>
            <p className="font-medium text-charcoal-900 text-sm">{tip.message}</p>
            <p className="text-xs text-charcoal-600 font-body mt-1 leading-relaxed">{tip.tip}</p>
          </div>
        </div>
      </div>

      {/* ── Task 3: Your routine today ── */}
      <div className="bg-white rounded-2xl border border-skin-100 overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-skin-50">
          <h2 className="font-display text-lg font-light text-charcoal-900">Your routine today</h2>
          <p className="text-xs text-charcoal-500 font-body">Checked against today&apos;s AI results</p>
        </div>

        {noProducts ? (
          <div className="p-4 flex items-start gap-3">
            <span className="text-lg shrink-0">📝</span>
            <div>
              <p className="text-sm text-charcoal-700 font-body leading-relaxed">
                Add products to your Diary and we&apos;ll check if they suit today&apos;s skin condition.
              </p>
              <Link href="/dashboard/diary/add"
                className="inline-flex items-center gap-1.5 text-xs text-skin-600 font-medium mt-2 underline">
                <BookOpen className="w-3 h-3" /> Go to Diary →
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-skin-50">
            {routineProducts.map((p, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                {p.flag ? (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <span className="text-sm shrink-0 mt-0.5">✅</span>
                )}
                <div>
                  <p className="text-sm font-medium text-charcoal-900">
                    {p.brand && <span className="text-charcoal-500 font-normal">{p.brand} </span>}
                    {p.name}
                  </p>
                  {p.flag ? (
                    <p className="text-xs text-amber-700 font-body mt-0.5">
                      Contains <em>{p.flag}</em> which may worsen{' '}
                      {p.flagType === 'pores' ? 'oiliness or breakouts' : 'redness'}.
                      Consider skipping tonight.
                    </p>
                  ) : (
                    <p className="text-xs text-charcoal-400 font-body mt-0.5">
                      Good choice for today&apos;s skin condition.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Task 4: Community teaser ── */}
      <div className="bg-cream-50 border border-cream-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-charcoal-500" />
          <h3 className="text-sm font-semibold text-charcoal-800">What works for skin like yours</h3>
        </div>
        <p className="text-xs text-charcoal-600 font-body leading-relaxed mb-3">
          Right now your recommendations are AI-based. As more users join SkinProof,
          you&apos;ll be able to see exactly what products helped people with:
        </p>
        <ul className="space-y-1 mb-3">
          {['Same skin type as you', 'Similar concerns (oiliness, pores, etc.)', 'Your age group'].map(item => (
            <li key={item} className="flex items-center gap-2 text-xs text-charcoal-600 font-body">
              <span className="w-1 h-1 rounded-full bg-skin-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-charcoal-600 font-body mb-3">
          …reach a skin score of 85+. Real results. Real people. No guesswork.
        </p>
        <div className="inline-flex items-center gap-1.5 bg-white border border-cream-300 rounded-full px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-xs text-charcoal-600 font-body">Community data: building — be an early tracker</span>
        </div>
      </div>

      {/* Come back tomorrow */}
      <p className="text-xs text-center text-charcoal-400 font-body">
        Come back tomorrow for Day {checkinCount + 1} — your skin trend is building 🔥
      </p>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link href="/dashboard"
          className="flex items-center justify-center gap-2 bg-white border border-skin-200 text-charcoal-700 py-3 rounded-xl text-sm font-medium hover:bg-skin-50 transition-colors">
          <Home className="w-4 h-4" /> Home
        </Link>
        <Link href="/dashboard/progress"
          className="flex items-center justify-center gap-2 bg-skin-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-skin-600 transition-colors">
          <TrendingUp className="w-4 h-4" /> View progress
        </Link>
      </div>
    </div>
  )
}

export default function CheckinResultPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-skin-400" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}
