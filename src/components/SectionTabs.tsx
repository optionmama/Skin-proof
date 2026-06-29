'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'

// Sub-navigation for the "我的紀錄" (Progress) tab. The 3-tab bottom nav points
// at /dashboard/progress; these pills let the user reach the other two sections
// that used to be their own tabs (products = old diary, profile). Rendered from
// the dashboard layout so it appears ONLY on these routes without touching any
// page's own content. Returns null everywhere else.
const SECTIONS: { href: string; key: TranslationKey }[] = [
  { href: '/dashboard/progress', key: 'sec_trend' },
  { href: '/dashboard/diary',    key: 'sec_products' },
  { href: '/dashboard/profile',  key: 'nav_profile' },
]

export default function SectionTabs() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const onSection = SECTIONS.some(s => pathname === s.href || pathname.startsWith(s.href + '/'))
  if (!onSection) return null

  return (
    <div className="px-4 pt-3">
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
        {SECTIONS.map(s => {
          const active = pathname === s.href || pathname.startsWith(s.href + '/')
          return (
            <Link
              key={s.href}
              href={s.href}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                active ? 'bg-white text-skin-600 shadow-sm' : 'text-charcoal-500'
              }`}
            >
              {t(s.key)}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
