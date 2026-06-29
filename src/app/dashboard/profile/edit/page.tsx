'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'
import { SKIN_CONCERNS } from '@/lib/utils'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'

// In-place editor for the skin profile. Lives under /dashboard so the bottom nav
// + section tabs stay visible (the user can never get trapped), and it edits the
// existing skin_profiles row directly instead of re-running the whole 8-step
// onboarding. The onboarding flow itself is left untouched.
const SKIN_TYPES = ['oily', 'dry', 'combination', 'normal', 'sensitive'] as const
const SKIN_EMOJI: Record<string, string> = { oily: '💧', dry: '🌵', combination: '⚖️', normal: '✨', sensitive: '🌸' }
const AGE_RANGES = ['Under 20', '20–25', '26–30', '31–35', '36–40', '41–45', '46+']
const FITZPATRICK = [
  { scale: 1, color: '#f5e6d3' }, { scale: 2, color: '#e8c9a8' }, { scale: 3, color: '#c8956c' },
  { scale: 4, color: '#a0714f' }, { scale: 5, color: '#6b4226' }, { scale: 6, color: '#3b2314' },
]

export default function ProfileEditPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [skinType, setSkinType] = useState<string | null>(null)
  const [ageRange, setAgeRange] = useState<string | null>(null)
  const [concerns, setConcerns] = useState<string[]>([])
  const [fitz, setFitz] = useState<number>(0)
  const [allergies, setAllergies] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data } = await supabase
        .from('skin_profiles')
        .select('skin_type, primary_concerns, known_allergies, fitzpatrick_scale, age_range')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setSkinType(data.skin_type)
        setAgeRange(data.age_range)
        setConcerns(data.primary_concerns || [])
        setFitz(data.fitzpatrick_scale || 0)
        setAllergies((data.known_allergies || []).join(', '))
      }
      setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from('skin_profiles').update({
      skin_type: skinType,
      age_range: ageRange,
      primary_concerns: concerns,
      fitzpatrick_scale: fitz || null,
      known_allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
    }).eq('user_id', user.id)
    setSaving(false)
    router.push('/dashboard/profile')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-skin-400" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.push('/dashboard/profile')} aria-label={t('products_back')}
          className="w-9 h-9 rounded-full bg-white border border-skin-200 flex items-center justify-center active:scale-95 transition-transform">
          <ArrowLeft className="w-4 h-4 text-charcoal-700" />
        </button>
        <h1 className="font-display text-2xl font-light text-charcoal-900">{t('profile_edit_title')}</h1>
      </div>

      <div className="space-y-6">
        {/* Skin type */}
        <div>
          <p className="text-sm font-semibold text-charcoal-700 mb-2">{t('profile_skin_type')}</p>
          <div className="grid grid-cols-2 gap-2">
            {SKIN_TYPES.map(value => (
              <button key={value} onClick={() => setSkinType(value)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${
                  skinType === value ? 'border-skin-400 bg-skin-50' : 'border-skin-100 bg-white'
                }`}>
                <span>{SKIN_EMOJI[value]}</span>
                <span className="font-medium text-charcoal-800">{t(`onb_skin_${value}` as TranslationKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Age range */}
        <div>
          <p className="text-sm font-semibold text-charcoal-700 mb-2">{t('profile_age_range')}</p>
          <div className="flex flex-wrap gap-2">
            {AGE_RANGES.map(range => (
              <button key={range} onClick={() => setAgeRange(range)}
                className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  ageRange === range ? 'bg-skin-500 text-white border-skin-500' : 'bg-white text-charcoal-700 border-skin-200'
                }`}>
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Concerns */}
        <div>
          <p className="text-sm font-semibold text-charcoal-700 mb-2">{t('profile_concerns')}</p>
          <div className="flex flex-wrap gap-2">
            {SKIN_CONCERNS.map(concern => {
              const selected = concerns.includes(concern)
              return (
                <button key={concern}
                  onClick={() => setConcerns(prev => selected ? prev.filter(c => c !== concern) : [...prev, concern])}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    selected ? 'bg-skin-500 text-white border-skin-500' : 'bg-white text-charcoal-700 border-skin-200'
                  }`}>
                  {t(`clabel_${concern}` as TranslationKey)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Skin tone */}
        <div>
          <p className="text-sm font-semibold text-charcoal-700 mb-2">{t('profile_fitzpatrick')}</p>
          <div className="grid grid-cols-2 gap-2">
            {FITZPATRICK.map(({ scale, color }) => (
              <button key={scale} onClick={() => setFitz(scale === fitz ? 0 : scale)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  fitz === scale ? 'border-skin-400 bg-skin-50' : 'border-skin-100 bg-white'
                }`}>
                <div className="w-7 h-7 rounded-full shrink-0 border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                <span className="text-sm font-medium text-charcoal-800 truncate">{t(`onb_fitz_${scale}_d` as TranslationKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <p className="text-sm font-semibold text-charcoal-700 mb-2">{t('profile_allergies')}</p>
          <input type="text" value={allergies} onChange={e => setAllergies(e.target.value)}
            placeholder={t('onb_allergies_ph')}
            className="w-full px-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 text-sm" />
          <p className="text-xs text-charcoal-400 mt-1">{t('onb_commas')}</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.push('/dashboard/profile')}
            className="flex-1 py-3 border border-skin-200 rounded-xl text-sm font-medium text-charcoal-600">
            {t('products_cancel')}
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-3 bg-skin-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {t('general_save')}
          </button>
        </div>
      </div>
    </div>
  )
}
