'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, Droplet, User } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'

// Sub-navigation for the "我的紀錄" (Progress) tab. Each section has its own
// colour so the bar reads clearly and feels intentional: progress = sage green,
// my products = pink, profile = warm gold. The active section is filled; the
// others show a soft tint of the same colour. Rendered from the dashboard
// layout so it appears ONLY on these routes; returns null everywhere else.
const SECTIONS: {
  href: string
  key: TranslationKey
  Icon: typeof TrendingUp
  active: string
  idle: string
}[] = [
  { href: '/dashboard/progress', key: 'sec_trend',   Icon: TrendingUp, active: 'bg-sage-500 text-white',  idle: 'bg-sage-50 text-sage-600' },
  { href: '/dashboard/diary',    key: 'sec_products', Icon: Droplet,    active: 'bg-[#d4537e] text-white', idle: 'bg-[#fbeaf0] text-[#993556]' },
  { href: '/dashboard/profile',  key: 'nav_profile',  Icon: User,       active: 'bg-[#c2912f] text-white', idle: 'bg-[#fdf6e9] text-[#946a1c]' },
]

export default function SectionTabs() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const onSection = SECTIONS.some(s => pathname === s.href || pathname.startsWith(s.href + '/'))
  if (!onSection) return null

  return (
    <div className="px-4 pt-3">
      <div className="flex gap-2">
        {SECTIONS.map(({ href, key, Icon, active, idle }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all ${isActive ? active : idle}`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />
              <span className="text-[13px] font-medium">{t(key)}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
