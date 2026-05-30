'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Home, Camera, BookOpen, TrendingUp, Sparkles, User } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function DashboardNav() {
  const pathname = usePathname()
  const supabase = createClient()
  const { t } = useLanguage()
  const [checkedInToday, setCheckedInToday] = useState(true)

  const navItems = [
    { href: '/dashboard',                 label: t('nav_home'),       icon: Home },
    { href: '/checkin',                   label: t('nav_daily_scan'), icon: Camera, checkinTab: true },
    { href: '/dashboard/diary',           label: t('nav_diary'),      icon: BookOpen },
    { href: '/dashboard/progress',        label: t('nav_progress'),   icon: TrendingUp },
    { href: '/dashboard/recommendations', label: t('nav_for_you'),    icon: Sparkles },
    { href: '/dashboard/profile',         label: t('nav_profile'),    icon: User },
  ]

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
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
          {navItems.map(({ href, label, icon: Icon, checkinTab }) => {
            const isActive = href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)

            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] ${
                  isActive
                    ? 'text-skin-600 bg-skin-50'
                    : 'text-charcoal-400 hover:text-charcoal-700 hover:bg-cream-200'
                }`}>
                <div className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? 'text-skin-600' : ''} />
                  {checkinTab && !checkedInToday && (
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
