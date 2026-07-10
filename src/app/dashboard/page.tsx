import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { TrendingUp, Sparkles, ChevronRight, ArrowRight } from 'lucide-react'
import { dayKeyInTZ, formatDayInTZ, hourInTZ, TZ_COOKIE } from '@/lib/day'
import RoutineList from '@/components/RoutineList'
import { getT } from '@/lib/i18n/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getT()
  const tz = (await cookies()).get(TZ_COOKIE)?.value

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
  const { data: routineRaw } = await supabase
    .from('user_routines')
    .select('id, product_id, routine_type, user_products(brand, name, category)')
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .order('step_order', { ascending: true })
    .limit(20)

  // Deduplicate by brand+name; if same product in AM and PM, show "AM · PM"
  const routineMap = new Map<string, { id: string; productId: string; brand: string; name: string; category: string | null; label: string }>()
  for (const item of routineRaw || []) {
    const prod = item.user_products as { brand?: string; name?: string; category?: string } | null
    if (!prod?.name) continue
    const key = `${(prod.brand || '').toLowerCase()}|${prod.name.toLowerCase()}`
    if (routineMap.has(key)) {
      routineMap.get(key)!.label = 'AM · PM'
    } else {
      routineMap.set(key, {
        id: item.id,
        productId: item.product_id as string,
        brand: prod.brand || '',
        name: prod.name,
        category: prod.category || null,
        label: (item.routine_type as string).toUpperCase(),
      })
    }
  }
  const routineItems = Array.from(routineMap.values()).slice(0, 4)

  // Deduplicate products by brand+name to handle duplicate DB entries
  const seen = new Set<string>()
  const productCount = (allProducts || []).filter(p => {
    const key = `${(p.brand || '').toLowerCase()}|${p.name.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).length

  const firstName = userData?.display_name?.split(' ')[0] || 'there'
  // Greeting + "today" in the USER's timezone (server local time is UTC).
  const hour = hourInTZ(tz)
  const greeting = hour < 12 ? t('home_greeting_morning') : hour < 18 ? t('home_greeting_afternoon') : t('home_greeting_evening')
  const todayStr = dayKeyInTZ(tz) // the USER's day, not the server's UTC day
  // Match by checkin_date OR by checked_in_at (handles both old and new
  // check-in flows). checked_in_at is a UTC timestamp — convert it to the
  // user's local day before comparing, or the fallback misfires near midnight.
  const todaysCheckin = recentCheckins?.find(c =>
    c.checkin_date === todayStr ||
    (c.checked_in_at && dayKeyInTZ(tz, new Date(c.checked_in_at)) === todayStr)
  )
  const streakCount = recentCheckins?.length || 0
  const total = totalCheckins || 0

  const latestPhoto = scoredPhotos?.[0]
  const prevPhoto = scoredPhotos?.[1]
  const latestScore = latestPhoto?.overall_skin_score
  const scoreDelta = latestScore && prevPhoto?.overall_skin_score
    ? Math.round((latestScore - prevPhoto.overall_skin_score) * 10) / 10
    : null

  const raw = latestPhoto?.ai_analysis_raw as Record<string, unknown> | null
  // Read from dedicated column first, fall back to ai_analysis_raw
  const mainConcern = (latestPhoto as Record<string, unknown> | null)?.main_concern as string
    || (raw?.main_concern as string)
    || null

  const concernLabels: Record<string, string> = {
    breakouts: t('concern_breakouts'),
    redness: t('concern_redness'),
    dryness: t('concern_dryness'),
    oiliness: t('concern_oiliness'),
    pores: t('concern_pores'),
    none: t('concern_none'),
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-charcoal-500 text-sm font-body">
            {formatDayInTZ(new Date(), tz, 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="font-display text-3xl font-light text-charcoal-900">
            {greeting}, <em className="text-skin-500">{firstName}</em>
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
            <p className="text-white/80 text-xs font-medium mb-2 font-body">{t('home_today_label')}</p>
            <h2 className="font-display text-2xl font-light mb-4">{t('home_start_title')}</h2>
            <div className="space-y-1.5 mb-5 font-body">
              {[t('home_step_photo'), t('home_step_products'), t('home_step_report')].map((s, i) => (
                <p key={i} className="text-white/80 text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                  {s}
                </p>
              ))}
            </div>
            <Link href="/checkin"
              className="inline-flex items-center gap-2 bg-white text-skin-600 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-skin-50 transition-colors active:scale-95">
              {t('home_start_checkin')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-sage-600 text-white rounded-2xl p-5 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="text-sage-200 text-xs mb-1 font-body">✓ {t('home_checkin_complete')}</p>
              {latestScore ? (
                <>
                  <p className="font-display text-3xl font-light">
                    {t('home_score')}: <strong>{Math.round(latestScore)}</strong>
                    {scoreDelta !== null && (
                      <span className={`text-base ml-2 font-body ${scoreDelta >= 0 ? 'text-sage-200' : 'text-red-300'}`}>
                        {scoreDelta >= 0 ? '↑' : '↓'} {scoreDelta >= 0 ? '+' : ''}{scoreDelta} {t('home_vs_prev')}
                      </span>
                    )}
                  </p>
                  {mainConcern && mainConcern !== 'none' && (
                    <p className="text-sage-200 text-xs mt-1 font-body">
                      {t('home_main_concern')}: {concernLabels[mainConcern] || mainConcern}
                    </p>
                  )}
                </>
              ) : (
                <p className="font-display text-xl font-light text-sage-200">{t('home_analysing')}</p>
              )}
              {streakCount > 1 && (
                <p className="text-sage-200 text-xs mt-1 font-body">🔥 {t('home_streak_days', { n: streakCount })}</p>
              )}
            </div>
            <Link href={`/dashboard/checkin/result?checkin_id=${todaysCheckin.id}`}
              className="bg-white/20 px-3 py-2 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors text-center shrink-0">
              {t('home_view_report')}
            </Link>
          </div>
        </div>
      )}

      {/* Progress nudge */}
      <div className="bg-cream-50 border border-cream-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
        <span className="text-sm shrink-0">{total >= 14 ? '💚' : '🔬'}</span>
        <p className="text-xs text-charcoal-600 font-body">
          {total >= 14
            ? t('home_great_consistency')
            : t('home_progress_nudge', { days: total })
          }
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-skin-100 text-center">
          <p className="font-display text-2xl font-light text-charcoal-900">{streakCount}</p>
          <p className="text-xs text-charcoal-500 font-body">{t('home_day_streak')}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-skin-100 text-center">
          <p className="font-display text-2xl font-light text-charcoal-900">
            {latestScore ? Math.round(latestScore) : '—'}
          </p>
          <p className="text-xs text-charcoal-500 font-body">{t('home_skin_score')}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-skin-100 text-center">
          <p className="font-display text-2xl font-light text-charcoal-900">{productCount || 0}</p>
          <p className="text-xs text-charcoal-500 font-body">{t('home_products')}</p>
        </div>
      </div>

      {/* 2 quick action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/dashboard/progress"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-sage-200 hover:shadow-sm transition-all active:scale-95">
          <div className="w-8 h-8 rounded-lg bg-sage-50 text-sage-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-charcoal-800">{t('home_my_progress')}</span>
        </Link>
        <Link href="/dashboard/recommendations"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-cream-200 hover:shadow-sm transition-all active:scale-95">
          <div className="w-8 h-8 rounded-lg bg-cream-100 text-cream-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-charcoal-800">{t('home_for_you')}</span>
        </Link>
      </div>

      {/* Current routine (from user_routines) */}
      {routineItems && routineItems.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-light text-charcoal-900">{t('home_current_routine')}</h2>
            <Link href="/dashboard/diary" className="text-xs text-skin-600 font-medium flex items-center gap-1">
              {t('home_edit')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <RoutineList items={routineItems} />
        </div>
      )}
    </div>
  )
}
