'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  User, Shield, Bell, ChevronRight, LogOut,
  Edit2, Moon, Sun, ExternalLink, AlertTriangle, CheckCircle2, Sparkles
} from 'lucide-react'

const SKIN_TYPE_LABELS: Record<string, string> = {
  normal: 'Normal', dry: 'Dry', oily: 'Oily',
  combination: 'Combination', sensitive: 'Sensitive',
}

const FITZPATRICK_LABELS: Record<number, string> = {
  1: 'Type I — Very fair, always burns',
  2: 'Type II — Fair, usually burns',
  3: 'Type III — Medium, sometimes burns',
  4: 'Type IV — Olive, rarely burns',
  5: 'Type V — Brown, very rarely burns',
  6: 'Type VI — Dark, never burns',
}

interface UserProfile {
  display_name: string | null
  email: string | null
  is_admin: boolean
}

interface SkinProfile {
  skin_type: string | null
  primary_concerns: string[] | null
  known_allergies: string[] | null
  fitzpatrick_scale: number | null
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null)
  const [routineCount, setRoutineCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const [{ data: userData }, { data: skinData }, { count }] = await Promise.all([
        supabase.from('users').select('display_name, is_admin').eq('id', user.id).single(),
        supabase.from('skin_profiles').select('skin_type, primary_concerns, known_allergies, fitzpatrick_scale').eq('user_id', user.id).single(),
        supabase.from('user_products').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
      ])

      setUserProfile({
        display_name: userData?.display_name || null,
        email: user.email || null,
        is_admin: userData?.is_admin || false,
      })
      setNewName(userData?.display_name || '')
      setSkinProfile(skinData)
      setRoutineCount(count ?? 0)
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSaveName = async () => {
    setSavingName(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ display_name: newName }).eq('id', user.id)
      setUserProfile((prev) => prev ? { ...prev, display_name: newName } : prev)
    }
    setSavingName(false)
    setEditingName(false)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-charcoal-400 text-sm">Loading…</div>
      </div>
    )
  }

  const initials = userProfile?.display_name
    ? userProfile.display_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : userProfile?.email?.[0].toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="bg-skin-600 text-white pt-12 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto text-3xl font-display font-bold">
            {initials}
          </div>
          {editingName ? (
            <div className="flex items-center gap-2 justify-center">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="bg-white/20 border border-white/40 rounded-xl px-3 py-1.5 text-white placeholder:text-white/60 text-center text-sm focus:outline-none focus:bg-white/30"
                placeholder="Your name"
              />
              <button onClick={handleSaveName} disabled={savingName}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition-colors">
                {savingName ? '…' : 'Save'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center">
              <h1 className="font-display text-2xl font-semibold">
                {userProfile?.display_name || 'Skincare User'}
              </h1>
              <button onClick={() => setEditingName(true)} className="opacity-70 hover:opacity-100">
                <Edit2 size={14} />
              </button>
            </div>
          )}
          <p className="text-white/70 text-sm">{userProfile?.email}</p>
          {userProfile?.is_admin && (
            <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
              <Shield size={10} /> Admin
            </span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 space-y-4 pb-8">

        {/* ── 我的保養品 Routine（新增區塊）── */}
        <Link
          href="/routine/setup"
          className="flex items-center justify-between bg-white border border-skin-100 rounded-2xl px-5 py-4 hover:bg-skin-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal-800">我的保養品 Routine</p>
              <p className="text-xs text-charcoal-400 mt-0.5">
                {routineCount > 0 ? `已加入 ${routineCount} 個產品` : '還沒有設定，點此開始'}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-charcoal-300" />
        </Link>

        {/* Skin Profile */}
        <div className="bg-white border border-skin-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-skin-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-charcoal-700">Skin Profile</h2>
            <Link href="/onboarding" className="text-xs text-skin-600 hover:underline flex items-center gap-1">
              <Edit2 size={11} /> Edit
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {skinProfile?.skin_type && (
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">Skin Type</span>
                <span className="text-charcoal-800 font-medium">{SKIN_TYPE_LABELS[skinProfile.skin_type]}</span>
              </div>
            )}
            {skinProfile?.fitzpatrick_scale && (
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">Fitzpatrick</span>
                <span className="text-charcoal-800 font-medium text-right max-w-[180px]">
                  {FITZPATRICK_LABELS[skinProfile.fitzpatrick_scale]}
                </span>
              </div>
            )}
            {skinProfile?.primary_concerns && skinProfile.primary_concerns.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-sm text-charcoal-500">Concerns</span>
                <div className="flex flex-wrap gap-1.5">
                  {skinProfile.primary_concerns.map((c) => (
                    <span key={c} className="text-xs bg-skin-50 text-skin-700 px-2 py-0.5 rounded-full border border-skin-200 capitalize">
                      {c.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {skinProfile?.known_allergies && skinProfile.known_allergies.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-sm text-charcoal-500">Allergies / Sensitivities</span>
                <div className="flex flex-wrap gap-1.5">
                  {skinProfile.known_allergies.map((a) => (
                    <span key={a} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!skinProfile && (
              <p className="text-sm text-charcoal-400 text-center py-2">
                No profile yet.{' '}
                <Link href="/onboarding" className="text-skin-600 hover:underline">Complete onboarding →</Link>
              </p>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white border border-skin-100 rounded-2xl overflow-hidden divide-y divide-skin-50">
          <div className="px-5 py-3">
            <h2 className="text-sm font-semibold text-charcoal-700">Settings</h2>
          </div>
          <button className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-skin-50 transition-colors">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-charcoal-400" />
              <span className="text-sm text-charcoal-700">Notifications</span>
            </div>
            <ChevronRight size={16} className="text-charcoal-300" />
          </button>
          <button className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-skin-50 transition-colors">
            <div className="flex items-center gap-3">
              <Moon size={16} className="text-charcoal-400" />
              <span className="text-sm text-charcoal-700">Dark Mode</span>
            </div>
            <div className="w-10 h-6 bg-charcoal-200 rounded-full relative">
              <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm" />
            </div>
          </button>
          <button className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-skin-50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-charcoal-400" />
              <span className="text-sm text-charcoal-700">Privacy & Data</span>
            </div>
            <ChevronRight size={16} className="text-charcoal-300" />
          </button>
        </div>

        {/* Admin */}
        {userProfile?.is_admin && (
          <Link href="/admin"
            className="flex items-center justify-between bg-skin-600 text-white px-5 py-4 rounded-2xl hover:bg-skin-700 transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={16} />
              <span className="text-sm font-medium">Admin Dashboard</span>
            </div>
            <ChevronRight size={16} className="opacity-70" />
          </Link>
        )}

        {/* Legal */}
        <div className="bg-white border border-skin-100 rounded-2xl overflow-hidden divide-y divide-skin-50">
          <Link href="/privacy" className="flex items-center justify-between px-5 py-3.5 hover:bg-skin-50 transition-colors">
            <span className="text-sm text-charcoal-700">Privacy Policy</span>
            <ExternalLink size={14} className="text-charcoal-300" />
          </Link>
          <Link href="/terms" className="flex items-center justify-between px-5 py-3.5 hover:bg-skin-50 transition-colors">
            <span className="text-sm text-charcoal-700">Terms of Service</span>
            <ExternalLink size={14} className="text-charcoal-300" />
          </Link>
        </div>

        <div className="text-center space-y-1 pb-2">
          <p className="text-xs text-charcoal-400">SkinProof v1.0.0</p>
          <p className="text-xs text-charcoal-300">© 2025 SkinProof. All rights reserved.</p>
        </div>

        {/* Sign out */}
        <button onClick={handleSignOut} disabled={signingOut}
          className="w-full py-3.5 border border-red-200 text-red-500 hover:bg-red-50 font-medium text-sm rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          <LogOut size={16} />
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
