import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TrendingUp, Sparkles, ChevronRight, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: userData },
    { data: recentCheckins },
    { data: allProducts },
    { count: totalCheckins },
  ] = await Promise.all([
    supabase.from('users').select('display_name').eq('id', user!.id).single(),
    supabase.from('skin_checkins')
      .select('*')
      .eq('user_id', user!.id)
      .order('checkin_date', { ascending: false })
      .limit(7),
    supabase.from('user_products')
      .select('brand, name')
      .eq('user_id', user!.id)
      .eq('is_active', true),
    supabase.from('skin_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
  ])

  // Latest 2 scored photos for score + delta
  const { data: scoredPhotos } = await supabase
    .from('skin_photos')
    .select('overall_skin_score, ai_analysis_raw, created_at')
    .eq('user_id', user!.id)
    .not('overall_skin_score', 'is', null)
    .order('created_at', { ascending: false })
    .limit(2)

  // Products from user_routines for "current routine" preview
  const { data: routineItems } = await supabase
    .from('user_routines')
    .select('id, routine_type, user_products(brand, name, category)')
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .order('step_order', { ascending: true })
    .limit(4)

  // Deduplicate products by brand+name to handle duplicate DB entries
  const seen = new Set<string>()
  const productCount = (allProducts || []).filter(p => {
    const key = `${(p.brand || '').toLowerCase()}|${p.name.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).length

  const firstName = userData?.display_name?.split(' ')[0] || 'there'
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todaysCheckin = recentCheckins?.find(c => c.checkin_date === todayStr)
  const streakCount = recentCheckins?.length || 0
  const total = totalCheckins || 0

  const latestPhoto = scoredPhotos?.[0]
  const prevPhoto = scoredPhotos?.[1]
  const latestScore = latestPhoto?.overall_skin_score
  const scoreDelta = latestScore && prevPhoto?.overall_skin_score
    ? Math.round((latestScore - prevPhoto.overall_skin_score) * 10) / 10
    : null

  const raw = latestPhoto?.ai_analysis_raw as Record<string, unknown> | null
  const mainConcern = (raw?.main_concern as string) || null

  const concernLabels: Record<string, string> = {
    breakouts: 'Breakouts',
    redness: 'Redness',
    dryness: 'Dryness',
    oiliness: 'Oiliness',
    pores: 'Enlarged pores',
    none: 'Looking good',
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-charcoal-500 text-sm font-body">{formatDate(today)}</p>
          <h1 className="font-display text-3xl font-light text-charcoal-900">
            Good morning, <em className="text-skin-500">{firstName}</em>
          </h1>
        </div>
        <Link href="/dashboard/profile"
          className="w-10 h-10 rounded-full bg-skin-200 flex items-center justify-center text-skin-600 font-display text-lg font-medium">
          {firstName[0].toUpperCase()}
        </Link>
      </div>

      {/* Main CTA */}
      {!todaysCheckin ? (
        <div className="bg-skin-500 text-white rounded-2xl p-5 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="relative">
            <p className="text-white/80 text-xs font-medium mb-2 font-body">TODAY&apos;S CHECK-IN</p>
            <h2 className="font-display text-2xl font-light mb-4">Start today&apos;s skin check</h2>
            <div className="space-y-1.5 mb-5 font-body">
              {['Take a photo', 'Confirm your products', 'Get your skin report'].map((s, i) => (
                <p key={i} className="text-white/80 text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                  {s}
                </p>
              ))}
            </div>
            <Link href="/checkin"
              className="inline-flex items-center gap-2 bg-white text-skin-600 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-skin-50 transition-colors active:scale-95">
              Start Daily Check-in <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-sage-600 text-white rounded-2xl p-5 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="text-sage-200 text-xs mb-1 font-body">✓ Today&apos;s check-in complete</p>
              {latestScore ? (
                <>
                  <p className="font-display text-3xl font-light">
                    Score: <strong>{Math.round(latestScore)}</strong>
                    {scoreDelta !== null && (
                      <span className={`text-base ml-2 font-body ${scoreDelta >= 0 ? 'text-sage-200' : 'text-red-300'}`}>
                        {scoreDelta >= 0 ? '↑' : '↓'} {scoreDelta >= 0 ? '+' : ''}{scoreDelta} vs prev
                      </span>
                    )}
                  </p>
                  {mainConcern && mainConcern !== 'none' && (
                    <p className="text-sage-200 text-xs mt-1 font-body">
                      Main concern: {concernLabels[mainConcern] || mainConcern}
                    </p>
                  )}
                </>
              ) : (
                <p className="font-display text-xl font-light text-sage-200">Analysing your skin…</p>
              )}
              {streakCount > 1 && (
                <p className="text-sage-200 text-xs mt-1 font-body">🔥 {streakCount} day streak</p>
              )}
            </div>
            <Link href={`/dashboard/checkin/result?checkin_id=${todaysCheckin.id}`}
              className="bg-white/20 px-3 py-2 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors text-center shrink-0">
              View today&apos;s<br />report →
            </Link>
          </div>
        </div>
      )}

      {/* Progress nudge */}
      <div className="bg-cream-50 border border-cream-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
        <span className="text-sm shrink-0">{total >= 14 ? '💚' : '🔬'}</span>
        <p className="text-xs text-charcoal-600 font-body">
          {total >= 14
            ? `Great consistency! Your skin trends are now reliable 💚`
            : <>You&apos;ve tracked <strong>{total} day{total !== 1 ? 's' : ''}</strong> — results sharpen after 14 days 🔬</>
          }
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-skin-100 text-center">
          <p className="font-display text-2xl font-light text-charcoal-900">{streakCount}</p>
          <p className="text-xs text-charcoal-500 font-body">Day streak</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-skin-100 text-center">
          <p className="font-display text-2xl font-light text-charcoal-900">
            {latestScore ? Math.round(latestScore) : '—'}
          </p>
          <p className="text-xs text-charcoal-500 font-body">Skin score</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-skin-100 text-center">
          <p className="font-display text-2xl font-light text-charcoal-900">{productCount || 0}</p>
          <p className="text-xs text-charcoal-500 font-body">Products</p>
        </div>
      </div>

      {/* 2 quick action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/dashboard/progress"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-sage-200 hover:shadow-sm transition-all active:scale-95">
          <div className="w-8 h-8 rounded-lg bg-sage-50 text-sage-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-charcoal-800">📊 My Progress</span>
        </Link>
        <Link href="/dashboard/recommendations"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-cream-200 hover:shadow-sm transition-all active:scale-95">
          <div className="w-8 h-8 rounded-lg bg-cream-100 text-cream-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-charcoal-800">✨ For You</span>
        </Link>
      </div>

      {/* Current routine (from user_routines) */}
      {routineItems && routineItems.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-light text-charcoal-900">Current routine</h2>
            <Link href="/routine/setup" className="text-xs text-skin-600 font-medium flex items-center gap-1">
              Edit <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {routineItems.map(item => {
              const prod = item.user_products as { brand?: string; name?: string; category?: string } | null
              return (
                <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-skin-100">
                  <div className="w-10 h-10 rounded-lg bg-skin-100 flex items-center justify-center text-skin-600 text-xs font-medium uppercase">
                    {prod?.category?.slice(0, 2) || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal-900 truncate">{prod?.name || '—'}</p>
                    <p className="text-xs text-charcoal-500">{prod?.brand}</p>
                  </div>
                  <span className="text-xs text-charcoal-400 font-body uppercase shrink-0">{item.routine_type}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
