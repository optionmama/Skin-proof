'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Camera,
  BookOpen,
  TrendingUp,
  Sparkles,
  User,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/checkin', label: 'Check-in', icon: Camera },
  { href: '/dashboard/diary', label: 'Diary', icon: BookOpen },
  { href: '/dashboard/progress', label: 'Progress', icon: TrendingUp },
  { href: '/dashboard/recommendations', label: 'For You', icon: Sparkles },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

export default function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-md border-t border-skin-100 safe-area-pb">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] ${
                  isActive
                    ? 'text-skin-600 bg-skin-50'
                    : 'text-charcoal-400 hover:text-charcoal-700 hover:bg-cream-200'
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? 'text-skin-600' : ''}
                />
                <span
                  className={`text-[10px] font-medium tracking-wide ${
                    isActive ? 'text-skin-600' : ''
                  }`}
                >
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
