'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'
import { createClient } from '@/lib/supabase/client'
import {
  User, Shield, Bell, ChevronRight, LogOut, Edit2, Moon, Sun,
  ExternalLink, Globe, Trash2, Download, X, Check, Loader2, Sparkles,
} from 'lucide-react'

interface UserProfile { display_name: string | null; email: string | null; is_admin: boolean }
interface SkinProfile {
  skin_type: string | null
  primary_concerns: string[] | null
  known_allergies: string[] | null
  fitzpatrick_scale: number | null
  age_range: string | null
}
interface UserSettings {
  notif_daily_scan: boolean
  notif_daily_scan_time: string
  notif_weekly_report: boolean
  notif_tips: boolean
  dark_mode: boolean
  language: string
  region: string
}

const REGIONS = [
  { value: 'Asia',      key: 'asia' },
  { value: 'Americas',  key: 'americas' },
  { value: 'Europe',    key: 'europe' },
  { value: 'Australia', key: 'australia' },
  { value: 'Global',    key: 'global' },
] as const

const DEFAULT_SETTINGS: UserSettings = {
  notif_daily_scan: true, notif_daily_scan_time: '08:00',
  notif_weekly_report: true, notif_tips: false,
  dark_mode: false, language: 'en', region: 'Asia',
}

const LANG_OPTIONS = [
  { value: 'en',    label: 'English',   sub: 'English' },
  { value: 'zh-TW', label: '繁體中文', sub: 'Traditional Chinese' },
  { value: 'zh-CN', label: '简体中文', sub: 'Simplified Chinese' },
]

function LangSelector({ currentLang, onSave }: { currentLang: string; onSave: (l: string) => Promise<void> }) {
  const { setLang, t } = useLanguage()
  return (
    <div className="space-y-2">
      {LANG_OPTIONS.map(opt => (
        <button key={opt.value} onClick={async () => { await onSave(opt.value); setLang(opt.value as 'en' | 'zh-TW' | 'zh-CN') }}
          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
            currentLang === opt.value ? 'border-skin-400 bg-skin-50' : 'border-skin-100 bg-white hover:border-skin-200'
          }`}>
          <div>
            <p className="font-medium text-charcoal-900 text-sm">{opt.label}</p>
            <p className="text-xs text-charcoal-400">{opt.sub}</p>
          </div>
          {currentLang === opt.value && <Check size={16} className="text-skin-500" />}
        </button>
      ))}
      <p className="text-xs text-charcoal-400 font-body pt-1 text-center">{t('profile_app_switches')}</p>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-skin-500' : 'bg-charcoal-200'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { t, lang } = useLanguage()

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [routineCount, setRoutineCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Panel visibility
  const [panel, setPanel] = useState<'notifications' | 'language' | 'region' | 'privacy' | null>(null)
  // Privacy actions
  const [confirmDeletePhotos, setConfirmDeletePhotos] = useState(false)
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)
  const [deletingPhotos, setDeletingPhotos] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  const saveSettings = useCallback(async (patch: Partial<UserSettings>) => {
    if (!userId) return
    const updated = { ...settings, ...patch }
    setSettings(updated)
    await supabase.from('user_settings').upsert({ user_id: userId, ...updated })

    // Apply dark mode immediately
    if ('dark_mode' in patch) {
      document.documentElement.classList.toggle('dark', patch.dark_mode!)
    }
  }, [userId, settings])

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUserId(user.id)

      const [{ data: userData }, { data: skinData }, { count }, { data: settingsData }] = await Promise.all([
        supabase.from('users').select('display_name, is_admin').eq('id', user.id).single(),
        supabase.from('skin_profiles')
          .select('skin_type, primary_concerns, known_allergies, fitzpatrick_scale, age_range')
          .eq('user_id', user.id).single(),
        supabase.from('user_products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('is_active', true),
        supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
      ])

      setUserProfile({ display_name: userData?.display_name || null, email: user.email || null, is_admin: userData?.is_admin || false })
      setNewName(userData?.display_name || '')
      setSkinProfile(skinData)
      setRoutineCount(count ?? 0)

      if (settingsData) {
        const s = settingsData as UserSettings
        setSettings(s)
        document.documentElement.classList.toggle('dark', s.dark_mode)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSaveName = async () => {
    setSavingName(true)
    if (userId) {
      await supabase.from('users').update({ display_name: newName }).eq('id', userId)
      setUserProfile(prev => prev ? { ...prev, display_name: newName } : prev)
    }
    setSavingName(false)
    setEditingName(false)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeletePhotos = async () => {
    if (!userId) return
    setDeletingPhotos(true)
    const { data: photos } = await supabase.from('skin_photos').select('storage_path').eq('user_id', userId)
    if (photos?.length) {
      await supabase.storage.from('skin-photos').remove(photos.map(p => p.storage_path))
      await supabase.from('skin_photos').delete().eq('user_id', userId)
    }
    setDeletingPhotos(false)
    setConfirmDeletePhotos(false)
  }

  const handleDeleteAccount = async () => {
    if (!userId) return
    setDeletingAccount(true)
    // Delete user data (cascade will handle related rows)
    await supabase.from('users').delete().eq('id', userId)
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-charcoal-400" />
      </div>
    )
  }

  const initials = userProfile?.display_name
    ? userProfile.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
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
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                className="bg-white/20 border border-white/40 rounded-xl px-3 py-1.5 text-white placeholder:text-white/60 text-center text-sm focus:outline-none focus:bg-white/30"
                placeholder={t('profile_default_name')} />
              <button onClick={handleSaveName} disabled={savingName}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition-colors">
                {savingName ? '…' : t('profile_save')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center">
              <h1 className="font-display text-2xl font-semibold">
                {userProfile?.display_name || t('profile_default_name')}
              </h1>
              <button onClick={() => setEditingName(true)} className="opacity-70 hover:opacity-100">
                <Edit2 size={14} />
              </button>
            </div>
          )}
          <p className="text-white/70 text-sm">{userProfile?.email}</p>
          {userProfile?.is_admin && (
            <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
              <Shield size={10} /> {t('profile_admin_badge')}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 space-y-4 pb-8">

        {/* Skincare Routine */}
        <Link href="/dashboard/diary"
          className="flex items-center justify-between bg-white border border-skin-100 rounded-2xl px-5 py-4 hover:bg-skin-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal-800">{t('profile_routine')}</p>
              <p className="text-xs text-charcoal-400 mt-0.5">
                {routineCount > 0 ? t('profile_products_added', { n: routineCount }) : t('profile_routine_none')}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-charcoal-300" />
        </Link>

        {/* Skin Profile */}
        <div className="bg-white border border-skin-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-skin-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-charcoal-700">{t('profile_skin_profile')}</h2>
            <Link href="/dashboard/profile/edit" className="text-xs text-skin-600 hover:underline flex items-center gap-1">
              <Edit2 size={11} /> {t('general_edit')}
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {skinProfile?.skin_type && (
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">{t('profile_skin_type')}</span>
                <span className="text-charcoal-800 font-medium">{t(`skintype_${skinProfile.skin_type}` as TranslationKey)}</span>
              </div>
            )}
            {skinProfile?.fitzpatrick_scale && (
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">{t('profile_fitzpatrick')}</span>
                <span className="text-charcoal-800 font-medium text-right max-w-[180px]">
                  {t(`fitz_${skinProfile.fitzpatrick_scale}` as TranslationKey)}
                </span>
              </div>
            )}
            {/* Age Range — Task 3 */}
            <div className="flex justify-between text-sm">
              <span className="text-charcoal-500">{t('profile_age_range')}</span>
              {skinProfile?.age_range ? (
                <span className="text-charcoal-800 font-medium">{skinProfile.age_range}</span>
              ) : (
                <Link href="/dashboard/profile/edit" className="text-skin-600 text-xs flex items-center gap-0.5 hover:underline">
                  {t('profile_not_set')} <ChevronRight size={12} />
                </Link>
              )}
            </div>
            {skinProfile?.primary_concerns && skinProfile.primary_concerns.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-sm text-charcoal-500">{t('profile_concerns')}</span>
                <div className="flex flex-wrap gap-1.5">
                  {skinProfile.primary_concerns.map(c => (
                    <span key={c} className="text-xs bg-skin-50 text-skin-700 px-2 py-0.5 rounded-full border border-skin-200 capitalize">
                      {c.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {skinProfile?.known_allergies && skinProfile.known_allergies.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-sm text-charcoal-500">{t('profile_allergies')}</span>
                <div className="flex flex-wrap gap-1.5">
                  {skinProfile.known_allergies.map(a => (
                    <span key={a} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">{a}</span>
                  ))}
                </div>
              </div>
            )}
            {!skinProfile && (
              <p className="text-sm text-charcoal-400 text-center py-2">
                {t('profile_no_profile')}{' '}
                <Link href="/onboarding" className="text-skin-600 hover:underline">{t('profile_complete_onboarding')}</Link>
              </p>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white border border-skin-100 rounded-2xl overflow-hidden divide-y divide-skin-50">
          <div className="px-5 py-3">
            <h2 className="text-sm font-semibold text-charcoal-700">{t('profile_settings')}</h2>
          </div>

          {/* Notifications */}
          <button onClick={() => setPanel('notifications')}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-skin-50 transition-colors">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-charcoal-400" />
              <span className="text-sm text-charcoal-700">{t('profile_notifications')}</span>
            </div>
            <ChevronRight size={16} className="text-charcoal-300" />
          </button>

          {/* Dark Mode — instant toggle */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              {settings.dark_mode ? <Moon size={16} className="text-charcoal-400" /> : <Sun size={16} className="text-charcoal-400" />}
              <span className="text-sm text-charcoal-700">{t('profile_dark_mode')}</span>
            </div>
            <Toggle checked={settings.dark_mode} onChange={v => saveSettings({ dark_mode: v })} />
          </div>

          {/* Language */}
          <button onClick={() => setPanel('language')}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-skin-50 transition-colors">
            <div className="flex items-center gap-3">
              <Globe size={16} className="text-charcoal-400" />
              <span className="text-sm text-charcoal-700">{t('profile_language')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-charcoal-400">{LANG_OPTIONS.find(o => o.value === lang)?.label || 'English'}</span>
              <ChevronRight size={16} className="text-charcoal-300" />
            </div>
          </button>

          {/* Region */}
          <button onClick={() => setPanel('region')}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-skin-50 transition-colors">
            <div className="flex items-center gap-3">
              <Globe size={16} className="text-charcoal-400" />
              <span className="text-sm text-charcoal-700">{t('profile_region')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-charcoal-400">{settings.region}</span>
              <ChevronRight size={16} className="text-charcoal-300" />
            </div>
          </button>

          {/* Privacy & Data */}
          <button onClick={() => setPanel('privacy')}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-skin-50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-charcoal-400" />
              <span className="text-sm text-charcoal-700">{t('profile_privacy')}</span>
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
              <span className="text-sm font-medium">{t('profile_admin_dashboard')}</span>
            </div>
            <ChevronRight size={16} className="opacity-70" />
          </Link>
        )}

        {/* Legal */}
        <div className="bg-white border border-skin-100 rounded-2xl overflow-hidden divide-y divide-skin-50">
          <Link href="/privacy" className="flex items-center justify-between px-5 py-3.5 hover:bg-skin-50 transition-colors">
            <span className="text-sm text-charcoal-700">{t('profile_privacy_policy')}</span>
            <ExternalLink size={14} className="text-charcoal-300" />
          </Link>
          <Link href="/terms" className="flex items-center justify-between px-5 py-3.5 hover:bg-skin-50 transition-colors">
            <span className="text-sm text-charcoal-700">{t('profile_terms')}</span>
            <ExternalLink size={14} className="text-charcoal-300" />
          </Link>
        </div>

        <div className="text-center space-y-1 pb-2">
          <p className="text-xs text-charcoal-400">SkinProof v1.0.0</p>
          <p className="text-xs text-charcoal-300">{t('profile_rights')}</p>
        </div>

        <button onClick={handleSignOut} disabled={signingOut}
          className="w-full py-3.5 border border-red-200 text-red-500 hover:bg-red-50 font-medium text-sm rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          <LogOut size={16} />
          {signingOut ? t('profile_signing_out') : t('profile_sign_out')}
        </button>
      </div>

      {/* ── Panel overlay ── */}
      {panel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm" onClick={() => setPanel(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl animate-slide-up">

            {/* Notifications panel */}
            {panel === 'notifications' && (
              <div className="px-5 pt-5 pb-8">
                <div className="w-10 h-1 bg-skin-200 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl font-light text-charcoal-900">{t('profile_notifications')}</h2>
                  <button onClick={() => setPanel(null)} className="p-1.5 hover:bg-skin-50 rounded-lg"><X size={16} /></button>
                </div>
                <div className="space-y-0 divide-y divide-skin-50 rounded-2xl border border-skin-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3.5 bg-white">
                    <div>
                      <p className="text-sm font-medium text-charcoal-800">{t('profile_notif_daily')}</p>
                      <p className="text-xs text-charcoal-400 mt-0.5">{t('profile_notif_daily_sub')}</p>
                    </div>
                    <Toggle checked={settings.notif_daily_scan} onChange={v => saveSettings({ notif_daily_scan: v })} />
                  </div>
                  {settings.notif_daily_scan && (
                    <div className="flex items-center justify-between px-4 py-3.5 bg-white">
                      <p className="text-sm text-charcoal-700">{t('profile_notif_time')}</p>
                      <input type="time" value={settings.notif_daily_scan_time}
                        onChange={e => saveSettings({ notif_daily_scan_time: e.target.value })}
                        className="text-sm text-charcoal-800 border border-skin-200 rounded-lg px-2 py-1 focus:outline-none focus:border-skin-400" />
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3.5 bg-white">
                    <div>
                      <p className="text-sm font-medium text-charcoal-800">{t('profile_notif_weekly')}</p>
                      <p className="text-xs text-charcoal-400 mt-0.5">{t('profile_notif_weekly_sub')}</p>
                    </div>
                    <Toggle checked={settings.notif_weekly_report} onChange={v => saveSettings({ notif_weekly_report: v })} />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5 bg-white">
                    <div>
                      <p className="text-sm font-medium text-charcoal-800">{t('profile_notif_tips')}</p>
                      <p className="text-xs text-charcoal-400 mt-0.5">{t('profile_notif_tips_sub')}</p>
                    </div>
                    <Toggle checked={settings.notif_tips} onChange={v => saveSettings({ notif_tips: v })} />
                  </div>
                </div>
                <p className="text-xs text-charcoal-400 font-body mt-3 text-center">
                  {t('profile_changes_auto')}
                </p>
              </div>
            )}

            {/* Language panel */}
            {panel === 'language' && (
              <div className="px-5 pt-5 pb-8">
                <div className="w-10 h-1 bg-skin-200 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl font-light text-charcoal-900">{t('profile_language')}</h2>
                  <button onClick={() => setPanel(null)} className="p-1.5 hover:bg-skin-50 rounded-lg"><X size={16} /></button>
                </div>
                <LangSelector currentLang={lang} onSave={async (l) => { await saveSettings({ language: l }) }} />
              </div>
            )}

            {/* Region panel */}
            {panel === 'region' && (
              <div className="px-5 pt-5 pb-8">
                <div className="w-10 h-1 bg-skin-200 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl font-light text-charcoal-900">{t('profile_region')}</h2>
                  <button onClick={() => setPanel(null)} className="p-1.5 hover:bg-skin-50 rounded-lg"><X size={16} /></button>
                </div>
                <p className="text-xs text-charcoal-500 font-body mb-4">
                  {t('profile_region_intro')}
                </p>
                <div className="space-y-2">
                  {REGIONS.map(r => (
                    <button key={r.value} onClick={() => saveSettings({ region: r.value })}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                        settings.region === r.value ? 'border-skin-400 bg-skin-50' : 'border-skin-100 bg-white hover:border-skin-200'
                      }`}>
                      <div>
                        <p className="font-medium text-charcoal-900 text-sm">{t(`region_${r.key}` as TranslationKey)}</p>
                        <p className="text-xs text-charcoal-500 font-body">{t(`region_${r.key}_desc` as TranslationKey)}</p>
                      </div>
                      {settings.region === r.value && <Check size={16} className="text-skin-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy & Data panel */}
            {panel === 'privacy' && (
              <div className="px-5 pt-5 pb-8">
                <div className="w-10 h-1 bg-skin-200 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl font-light text-charcoal-900">{t('profile_data_title')}</h2>
                  <button onClick={() => setPanel(null)} className="p-1.5 hover:bg-skin-50 rounded-lg"><X size={16} /></button>
                </div>

                <div className="space-y-4">
                  {/* Photos */}
                  <div className="bg-skin-50 border border-skin-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-charcoal-800 mb-1">{t('profile_photos')}</p>
                    <p className="text-xs text-charcoal-500 font-body mb-3">
                      {t('profile_photos_body')}
                    </p>
                    {confirmDeletePhotos ? (
                      <div className="space-y-2">
                        <p className="text-xs text-red-600 font-medium">{t('profile_delete_photos_warn')}</p>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmDeletePhotos(false)}
                            className="flex-1 py-2 border border-skin-200 rounded-xl text-xs text-charcoal-600">{t('general_cancel')}</button>
                          <button onClick={handleDeletePhotos} disabled={deletingPhotos}
                            className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-medium disabled:opacity-60">
                            {deletingPhotos ? t('profile_deleting') : t('profile_delete_photos_confirm')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeletePhotos(true)}
                        className="flex items-center gap-2 text-xs text-red-500 font-medium border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
                        <Trash2 size={12} /> {t('profile_delete_photos_btn')}
                      </button>
                    )}
                  </div>

                  {/* Account */}
                  <div className="bg-skin-50 border border-skin-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-charcoal-800 mb-3">{t('profile_account_data')}</p>
                    <div className="space-y-2">
                      <button className="flex items-center gap-2 text-xs text-charcoal-600 font-medium border border-skin-200 px-3 py-2 rounded-xl hover:bg-skin-100 transition-colors w-full">
                        <Download size={12} /> {t('profile_download_data')}
                        <span className="text-charcoal-400 ml-auto">{t('profile_coming_soon')}</span>
                      </button>
                      {confirmDeleteAccount ? (
                        <div className="space-y-2 mt-2">
                          <p className="text-xs text-red-600 font-medium">{t('profile_delete_account_warn')}</p>
                          <div className="flex gap-2">
                            <button onClick={() => setConfirmDeleteAccount(false)}
                              className="flex-1 py-2 border border-skin-200 rounded-xl text-xs text-charcoal-600">{t('general_cancel')}</button>
                            <button onClick={handleDeleteAccount} disabled={deletingAccount}
                              className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-medium disabled:opacity-60">
                              {deletingAccount ? t('profile_deleting') : t('profile_delete_account_confirm')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteAccount(true)}
                          className="flex items-center gap-2 text-xs text-red-500 font-medium border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors w-full">
                          <Trash2 size={12} /> {t('profile_delete_account_btn')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
