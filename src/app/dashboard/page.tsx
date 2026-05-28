import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TrendingUp, BookOpen, Sparkles, ChevronRight, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: userData },
    { data: recentCheckins },
    { data: recentLogs },
    { count: totalCheckins },
  ] = await Promise.all([
    supabase.from('users').select('display_name').eq('id', user!.id).single(),
    supabase.from('skin_checkins')
      .select('*')
      .eq('user_id', user!.id)
      .order('checkin_date', { ascending: false })
      .limit(7),
    supabase.from('user_product_logs')
      .select('*, product:products(name, brand, category)')
      .eq('user_id', user!.id)
      .eq('is_current', true)
      .limit(3),
    supabase.from('skin_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
  ])

  const { data: latestPhoto } = await supabase
    .from('skin_photos')
    .select('overall_skin_score, created_at')
    .eq('user_id', user!.id)
    .not('overall_skin_score', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const firstName = userData?.display_name?.split(' ')[0] || 'there'
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todaysCheckin = recentCheckins?.find(c => c.checkin_date === todayStr)
  const streakCount = recentCheckins?.length || 0
  const latestScore = latestPhoto?.overall_skin_score
  const total = totalCheckins || 0

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
              <p className="text-white/80 text-xs flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                Take a photo
              </p>
              <p className="text-white/80 text-xs flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                Confirm your products
              </p>
              <p className="text-white/80 text-xs flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                Get your skin report
              </p>
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
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sage-200 text-xs mb-1 font-body">✓ Today&apos;s check-in complete</p>
              {latestScore && (
                <p className="font-display text-3xl font-light">
                  Score: <strong>{Math.round(latestScore)}</strong>
                </p>
              )}
              {streakCount > 1 && (
                <p className="text-sage-200 text-xs mt-1 font-body">🔥 {streakCount} day streak</p>
              )}
            </div>
            <Link href={`/dashboard/checkin/result?checkin_id=${todaysCheckin.id}`}
              className="bg-white/20 px-3 py-2 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors text-right shrink-0">
              View today&apos;s<br />report →
            </Link>
          </div>
        </div>
      )}

      {/* Progress nudge */}
      {total < 30 && (
        <div className="bg-cream-50 border border-cream-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
          <span className="text-sm shrink-0">🔬</span>
          <p className="text-xs text-charcoal-600 font-body">
            You&apos;ve tracked <strong>{total} day{total !== 1 ? 's' : ''}</strong>.
            Results sharpen after 14 days — keep going!
          </p>
        </div>
      )}

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
          <p className="font-display text-2xl font-light text-charcoal-900">{recentLogs?.length || 0}</p>
          <p className="text-xs text-charcoal-500 font-body">Products</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { href: '/dashboard/progress',       icon: TrendingUp, label: 'Progress',      color: 'bg-sage-50 text-sage-600 border-sage-200' },
          { href: '/dashboard/diary',           icon: BookOpen,   label: 'Product Diary', color: 'bg-skin-50 text-skin-600 border-skin-200' },
          { href: '/dashboard/recommendations', icon: Sparkles,   label: 'For You',       color: 'bg-cream-100 text-cream-600 border-cream-200' },
          { href: '/dashboard/scan',            icon: Sparkles,   label: 'AI Scan',       color: 'bg-cream-100 text-cream-600 border-cream-200' },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-3 p-4 bg-white rounded-xl border ${color.split(' ')[2]} hover:shadow-sm transition-all active:scale-95`}>
            <div className={`w-8 h-8 rounded-lg ${color.split(' ')[0]} ${color.split(' ')[1]} flex items-center justify-center`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-charcoal-800">{label}</span>
          </Link>
        ))}
      </div>

      {/* Current routine */}
      {recentLogs && recentLogs.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-light text-charcoal-900">Current routine</h2>
            <Link href="/dashboard/diary" className="text-xs text-skin-600 font-medium flex items-center gap-1">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-skin-100">
                <div className="w-10 h-10 rounded-lg bg-skin-100 flex items-center justify-center text-skin-600 text-xs font-medium uppercase">
                  {(log.product as { category?: string } | null)?.category?.slice(0, 2) || '??'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal-900 truncate">{(log.product as { name?: string } | null)?.name}</p>
                  <p className="text-xs text-charcoal-500">{(log.product as { brand?: string } | null)?.brand}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  log.skin_reaction === 'positive' ? 'bg-sage-100 text-sage-600' :
                  log.skin_reaction === 'negative' ? 'bg-red-100 text-red-600' :
                  'bg-skin-100 text-skin-600'
                }`}>
                  {log.skin_reaction || 'tracking'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
