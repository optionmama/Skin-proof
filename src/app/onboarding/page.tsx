'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'
import { SKIN_CONCERNS } from '@/lib/utils'
import { redirectAfterOnboarding } from '@/lib/onboarding-complete'
import type { SkinType } from '@/types/database'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Language, TranslationKey } from '@/lib/i18n/translations'

type Step = 'welcome' | 'skin_type' | 'age_range' | 'concerns' | 'allergies' | 'fitzpatrick' | 'disclaimer' | 'done'

const STEPS: Step[] = ['welcome', 'skin_type', 'age_range', 'concerns', 'allergies', 'fitzpatrick', 'disclaimer', 'done']

// Static parts only; labels/descriptions are resolved via i18n at render.
const SKIN_TYPES: { value: SkinType; emoji: string }[] = [
  { value: 'oily',        emoji: '💧' },
  { value: 'dry',         emoji: '🌵' },
  { value: 'combination', emoji: '⚖️' },
  { value: 'normal',      emoji: '✨' },
  { value: 'sensitive',   emoji: '🌸' },
]

// Canonical age values stored in the DB (matched by ageRangeToGroup) — never localise the stored value.
const AGE_RANGES = ['Under 20', '20–25', '26–30', '31–35', '36–40', '41–45', '46+']

const FITZPATRICK = [
  { scale: 1, label: 'Type I',   color: '#f5e6d3' },
  { scale: 2, label: 'Type II',  color: '#e8c9a8' },
  { scale: 3, label: 'Type III', color: '#c8956c' },
  { scale: 4, label: 'Type IV',  color: '#a0714f' },
  { scale: 5, label: 'Type V',   color: '#6b4226' },
  { scale: 6, label: 'Type VI',  color: '#3b2314' },
]

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en',    label: 'English' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'zh-CN', label: '简体中文' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t, lang, setLang } = useLanguage()
  const [stepIndex, setStepIndex] = useState(0)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const [skinType, setSkinType]         = useState<SkinType | ''>('')
  const [ageRange, setAgeRange]         = useState('')
  const [concerns, setConcerns]         = useState<string[]>([])
  const [allergies, setAllergies]       = useState('')
  const [sensitivities, setSensitivities] = useState('')
  const [fitzpatrick, setFitzpatrick]   = useState<number>(0)
  const [dermatologist, setDermatologist] = useState(false)
  const [disclaimerAck, setDisclaimerAck] = useState(false)

  const step     = STEPS[stepIndex]
  const progress = (stepIndex / (STEPS.length - 1)) * 100

  const ageLabel = (range: string) =>
    range === 'Under 20' ? t('onb_age_under20') : range === '46+' ? t('onb_age_46plus') : range

  const handleNext = () => { if (stepIndex < STEPS.length - 1) setStepIndex(i => i + 1) }
  const handleBack = () => { if (stepIndex > 0) setStepIndex(i => i - 1) }

  const handleComplete = async () => {
    if (!disclaimerAck) { setError(t('onb_disc_required')); return }
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase.from('skin_profiles').upsert({
        user_id:           user.id,
        skin_type:         skinType   || undefined,
        age_range:         ageRange   || undefined,
        primary_concerns:  concerns,
        known_allergies:   allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        known_sensitivities: sensitivities ? sensitivities.split(',').map(s => s.trim()).filter(Boolean) : [],
        fitzpatrick_scale: fitzpatrick || undefined,
        dermatologist_care: dermatologist,
        onboarding_completed_at: new Date().toISOString(),
      })

      await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id)
      await redirectAfterOnboarding(router)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onb_error_generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-skin-50 flex flex-col overflow-y-auto">
      {/* Progress bar */}
      <div className="fixed top-0 inset-x-0 z-50 bg-skin-50/80 backdrop-blur-md px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="w-6 h-6 rounded-full bg-skin-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-charcoal-500 shrink-0 font-mono">
            {stepIndex + 1}/{STEPS.length}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 pt-[calc(env(safe-area-inset-top)+5.5rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">

        {/* WELCOME */}
        {step === 'welcome' && (
          <div className="flex-1 flex flex-col justify-center animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-skin-500 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-4xl font-light text-charcoal-900 mb-4">
              {t('onb_welcome_title')}
            </h1>
            <p className="text-charcoal-600 font-body leading-relaxed mb-6">
              {t('onb_welcome_sub')}
            </p>

            {/* Language picker — let everyone choose their language up front */}
            <p className="text-sm font-medium text-charcoal-700 mb-2">{t('onb_pick_language')}</p>
            <div className="flex gap-2">
              {LANGUAGES.map(({ code, label }) => (
                <button key={code} onClick={() => setLang(code)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    lang === code ? 'border-skin-400 bg-skin-50 text-skin-700 shadow-sm' : 'border-skin-200 bg-white text-charcoal-700 hover:border-skin-300'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SKIN TYPE */}
        {step === 'skin_type' && (
          <div className="flex-1 animate-fade-up">
            <h2 className="font-display text-3xl font-light text-charcoal-900 mb-2">{t('onb_skin_q')}</h2>
            <p className="text-charcoal-500 text-sm mb-6 font-body">{t('onb_skin_sub')}</p>
            <div className="space-y-2">
              {SKIN_TYPES.map(({ value, emoji }) => (
                <button key={value} onClick={() => setSkinType(value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    skinType === value ? 'border-skin-400 bg-skin-50 shadow-sm' : 'border-skin-100 bg-white hover:border-skin-200'
                  }`}>
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-charcoal-900">{t(`onb_skin_${value}` as TranslationKey)}</p>
                    <p className="text-xs text-charcoal-500 font-body">{t(`onb_skin_${value}_d` as TranslationKey)}</p>
                  </div>
                  {skinType === value && <Check className="w-5 h-5 text-skin-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AGE RANGE */}
        {step === 'age_range' && (
          <div className="flex-1 animate-fade-up">
            <h2 className="font-display text-3xl font-light text-charcoal-900 mb-2">{t('onb_age_q')}</h2>
            <p className="text-charcoal-500 text-sm mb-6 font-body">{t('onb_age_sub')}</p>
            <div className="space-y-2">
              {AGE_RANGES.map(range => (
                <button key={range} onClick={() => setAgeRange(range)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                    ageRange === range ? 'border-skin-400 bg-skin-50 shadow-sm' : 'border-skin-100 bg-white hover:border-skin-200'
                  }`}>
                  <span className="font-medium text-charcoal-900">{ageLabel(range)}</span>
                  {ageRange === range && <Check className="w-5 h-5 text-skin-500 shrink-0" />}
                </button>
              ))}
            </div>
            <p className="text-xs text-charcoal-400 font-body mt-4">{t('onb_age_skip')}</p>
          </div>
        )}

        {/* CONCERNS */}
        {step === 'concerns' && (
          <div className="flex-1 animate-fade-up">
            <h2 className="font-display text-3xl font-light text-charcoal-900 mb-2">{t('onb_concerns_q')}</h2>
            <p className="text-charcoal-500 text-sm mb-6 font-body">{t('onb_concerns_sub')}</p>
            <div className="flex flex-wrap gap-2">
              {SKIN_CONCERNS.map(concern => {
                const selected = concerns.includes(concern)
                return (
                  <button key={concern}
                    onClick={() => setConcerns(prev => selected ? prev.filter(c => c !== concern) : [...prev, concern])}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      selected ? 'bg-skin-500 text-white border-skin-500 shadow-sm' : 'bg-white text-charcoal-700 border-skin-200 hover:border-skin-400'
                    }`}>
                    {t(`clabel_${concern}` as TranslationKey)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ALLERGIES */}
        {step === 'allergies' && (
          <div className="flex-1 animate-fade-up">
            <h2 className="font-display text-3xl font-light text-charcoal-900 mb-2">{t('onb_allergies_q')}</h2>
            <p className="text-charcoal-500 text-sm mb-6 font-body">{t('onb_allergies_sub')}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  {t('onb_allergies_label')} <span className="text-charcoal-400 font-normal">{t('onb_optional')}</span>
                </label>
                <input type="text" value={allergies} onChange={e => setAllergies(e.target.value)}
                  placeholder={t('onb_allergies_ph')}
                  className="w-full px-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 font-body text-sm" />
                <p className="text-xs text-charcoal-400 mt-1">{t('onb_commas')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  {t('onb_sensitivities_label')} <span className="text-charcoal-400 font-normal">{t('onb_optional')}</span>
                </label>
                <input type="text" value={sensitivities} onChange={e => setSensitivities(e.target.value)}
                  placeholder={t('onb_sensitivities_ph')}
                  className="w-full px-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 font-body text-sm" />
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-skin-100">
                <input type="checkbox" id="derm" checked={dermatologist} onChange={e => setDermatologist(e.target.checked)} className="w-4 h-4 rounded accent-skin-500" />
                <label htmlFor="derm" className="text-sm text-charcoal-700 font-body">{t('onb_derm')}</label>
              </div>
            </div>
          </div>
        )}

        {/* FITZPATRICK */}
        {step === 'fitzpatrick' && (
          <div className="flex-1 animate-fade-up">
            <h2 className="font-display text-3xl font-light text-charcoal-900 mb-2">{t('onb_fitz_q')}</h2>
            <p className="text-charcoal-500 text-sm mb-1 font-body">{t('onb_fitz_sub')}</p>
            <p className="text-xs text-charcoal-400 mb-6 font-body">{t('onb_fitz_skip')}</p>
            <div className="grid grid-cols-2 gap-2">
              {FITZPATRICK.map(({ scale, label, color }) => (
                <button key={scale} onClick={() => setFitzpatrick(scale === fitzpatrick ? 0 : scale)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    fitzpatrick === scale ? 'border-skin-400 bg-skin-50' : 'border-skin-100 bg-white hover:border-skin-200'
                  }`}>
                  <div className="w-8 h-8 rounded-full shrink-0 border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-charcoal-900">{label}</p>
                    <p className="text-xs text-charcoal-500 truncate font-body">{t(`onb_fitz_${scale}_d` as TranslationKey)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DISCLAIMER */}
        {step === 'disclaimer' && (
          <div className="flex-1 animate-fade-up">
            <h2 className="font-display text-3xl font-light text-charcoal-900 mb-4">{t('onb_disc_title')}</h2>
            <div className="bg-white rounded-2xl border border-skin-200 p-5 mb-4 space-y-3">
              {(['onb_disc_1', 'onb_disc_2', 'onb_disc_3', 'onb_disc_4'] as const).map((key, i) => (
                <div key={key} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-skin-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-skin-600 text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-charcoal-700 font-body leading-relaxed">{t(key)}</p>
                </div>
              ))}
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={disclaimerAck} onChange={e => setDisclaimerAck(e.target.checked)} className="w-4 h-4 rounded accent-skin-500 mt-0.5" />
              <span className="text-sm text-charcoal-700 font-body leading-relaxed">
                {t('onb_disc_ack')}
              </span>
            </label>
            {error && <p className="text-red-600 text-sm mt-3 font-body">{error}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {stepIndex > 0 && step !== 'done' && (
            <button onClick={handleBack}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-skin-200 text-charcoal-700 font-medium hover:bg-skin-50 transition-colors">
              <ChevronLeft className="w-4 h-4" /> {t('onb_back')}
            </button>
          )}
          {step === 'disclaimer' ? (
            <button onClick={handleComplete} disabled={loading || !disclaimerAck}
              className="flex-1 flex items-center justify-center gap-2 bg-skin-500 text-white py-3 rounded-xl font-medium hover:bg-skin-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('onb_complete')}
            </button>
          ) : step !== 'done' && (
            <button onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 bg-skin-500 text-white py-3 rounded-xl font-medium hover:bg-skin-600 transition-all">
              {step === 'welcome' ? t('onb_lets_go') : t('onb_continue')}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
