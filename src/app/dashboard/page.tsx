import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Camera, TrendingUp, BookOpen, Sparkles, ChevronRight, Plus } from 'lucide-react'
import { formatDate, SHORT_DISCLAIMER } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: userData },
    { data: recentCheckins },
    { data: recentLogs },
    { data: recentPhoto },
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
    supabase.from('skin_photos')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  const firstName = userData?.display_name?.split(' ')[0] || 'there'
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todaysCheckin = recentCheckins?.find(c => c.checkin_date === todayStr)
  const streakCount = recentCheckins?.length || 0
  const latestScore = recentPhoto?.data?.overall_skin_score

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
        <Link href="/dashboard/profile" className="w-10 h-10 rounded-full bg-skin-200 flex items-center justify-center text-skin-600 font-display text-lg font-medium">
          {firstName[0].toUpperCase()}
        </Link>
      </div>

      {/* Today's Check-in CTA */}
      {!todaysCheckin ? (
        <Link
          href="/dashboard/checkin"
          className="block bg-skin-500 text-white rounded-2xl p-5 mb-4 relative overflow-hidden hover:bg-skin-600 transition-colors active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-5 h-5" />
              <span className="font-medium text-sm">Today's check-in</span>
            </div>
            <p className="font-display text-2xl font-light mb-1">Log your skin today</p>
            <p className="text-white/80 text-xs font-body">Upload photo · Rate how your skin feels</p>
          </div>
        </Link>
      ) : (
        <div className="bg-sage-600 text-white rounded-2xl p-5 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sage-200 text-xs mb-1">Today completed ✓</p>
              <p className="font-display text-2xl font-light">Feeling {todaysCheckin.overall_feeling}/10</p>
              {streakCount > 1 && (
                <p className="text-sage-200 text-xs mt-1 font-body">🔥 {streakCount} day streak</p>
              )}
            </div>
            <Link
              href={`/dashboard/checkin?edit=${todaysCheckin.id}`}
              className="bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
      )}

      {/* Stats row */}
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
          { href: '/dashboard/scan', icon: Sparkles, label: 'AI Scan', color: 'bg-cream-100 text-cream-600 border-cream-200' },
          { href: '/dashboard/progress', icon: TrendingUp, label: 'Progress', color: 'bg-sage-50 text-sage-600 border-sage-200' },
          { href: '/dashboard/diary', icon: BookOpen, label: 'Product Diary', color: 'bg-skin-50 text-skin-600 border-skin-200' },
          { href: '/dashboard/recommendations', icon: Sparkles, label: 'Discover', color: 'bg-cream-100 text-cream-600 border-cream-200' },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 p-4 bg-white rounded-xl border ${color.split(' ')[2]} hover:shadow-sm transition-all active:scale-95`}
          >
            <div className={`w-8 h-8 rounded-lg ${color.split(' ')[0]} ${color.split(' ')[1]} flex items-center justify-center`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-charcoal-800">{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Products */}
      {recentLogs && recentLogs.length > 0 && (
        <div className="mb-6">
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
                  {log.product?.category?.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal-900 truncate">{log.product?.name}</p>
                  <p className="text-xs text-charcoal-500">{log.product?.brand}</p>
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

      {/* Disclaimer */}
      <div className="disclaimer-box">
        <p className="font-semibold text-charcoal-700 mb-0.5">⚠️ {SHORT_DISCLAIMER}</p>
        <p>AI skin scores are for personal tracking only, not medical diagnosis.</p>
      </div>
    </div>
  )
}
