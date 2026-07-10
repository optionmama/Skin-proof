'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, TrendingUp, Sparkles } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { localDayKey, TZ_COOKIE } from '@/lib/day'
import { notificationsAvailable, hasNotificationPermission, scheduleDailyReminder } from '@/lib/native/notifications'

export default function DashboardNav() {
  const pathname = usePathname()
  const supabase = createClient()
  const { t, lang } = useLanguage()
  const [checkedInToday, setCheckedInToday] = useState(true)

  // Re-sync the daily reminder with the saved settings on launch (and when the
  // locale hydrates/changes, so the notification text matches the UI language).
  // Never prompts for permission here — only reschedules if already granted.
  // Guarded by notificationsAvailable(): a pre-v1.1 binary or plain web exits
  // immediately and can never crash (the plugin isn't in that binary).
  useEffect(() => {
    const sync = async () => {
      try {
        if (!(await notificationsAvailable())) return
        if (!(await hasNotificationPermission())) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('user_settings')
          .select('notif_daily_scan, notif_daily_scan_time')
          .eq('user_id', user.id)
          .single()
        const s = data as { notif_daily_scan?: boolean; notif_daily_scan_time?: string } | null
        if (s?.notif_daily_scan) {
          await scheduleDailyReminder(s.notif_daily_scan_time || '20:00', t('notif_daily_title'), t('notif_daily_body'))
        }
      } catch { /* reminders must never break navigation */ }
    }
    sync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  // 3-tab structure. Each tab "owns" several routes (e.g. Scan owns the camera
  // flow + result), and stays highlighted across all of them.
  const navItems = [
    { href: '/dashboard/scan',            label: t('nav_scan'),      icon: Camera,
      match: ['/dashboard/scan', '/dashboard/checkin', '/checkin'], scanTab: true },
    { href: '/dashboard/recommendations', label: t('nav_for_you'),   icon: Sparkles,
      match: ['/dashboard/recommendations'] },
    { href: '/dashboard/progress',        label: t('nav_my_record'), icon: TrendingUp,
      match: ['/dashboard/progress', '/dashboard/diary', '/dashboard/profile'] },
  ]

  // Publish the device timezone for server components (scan/home/For You date
  // rendering). The nav is on every dashboard page, so the cookie exists before
  // any server page needs it (very first request falls back to UTC, then heals).
  useEffect(() => {
    try {
      // Written raw — '/' is legal in cookie values, and day.ts normalizes an
      // encoded value defensively anyway.
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) document.cookie = `${TZ_COOKIE}=${tz}; path=/; max-age=31536000; SameSite=Lax`
    } catch { /* older WebView without Intl tz — server falls back to UTC */ }
  }, [])

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const today = localDayKey()
      const { data } = await supabase
        .from('skin_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('checkin_date', today)
        .limit(1)
        .single()
      setCheckedInToday(!!data)
    }
    check()
  }, [pathname])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-md border-t border-skin-100 safe-area-pb">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ href, label, icon: Icon, match, scanTab }) => {
            const isActive = match.some(m => pathname === m || pathname.startsWith(m + '/'))

            return (
              // prefetch=false: tabs were prefetched while the user was mid-
              // check-in, so tapping Scan later could show that STALE snapshot
              // (old photo/score). Fetch fresh on tap instead.
              <Link key={href} href={href} prefetch={false}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] ${
                  isActive
                    ? 'text-skin-600 bg-skin-50'
                    : 'text-charcoal-400 hover:text-charcoal-700 hover:bg-cream-200'
                }`}>
                <div className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? 'text-skin-600' : ''} />
                  {scanTab && !checkedInToday && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                  )}
                </div>
                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-skin-600' : ''}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
