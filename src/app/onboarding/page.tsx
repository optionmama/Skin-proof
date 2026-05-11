'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'
import { SKIN_CONCERNS, skinConcernLabel } from '@/lib/utils'
import type { SkinType } from '@/types/database'

type Step = 'welcome' | 'skin_type' | 'concerns' | 'allergies' | 'fitzpatrick' | 'disclaimer' | 'done'

const STEPS: Step[] = ['welcome', 'skin_type', 'concerns', 'allergies', 'fitzpatrick', 'disclaimer', 'done']

const SKIN_TYPES: { value: SkinType; label: string; desc: string; emoji: string }[] = [
  { value: 'oily', label: 'Oily', desc: 'Shine, enlarged pores, prone to breakouts', emoji: '💧' },
  { value: 'dry', label: 'Dry', desc: 'Tight, flaky, sometimes sensitive', emoji: '🌵' },
  { value: 'combination', label: 'Combination', desc: 'Oily T-zone, normal or dry cheeks', emoji: '⚖️' },
  { value: 'normal', label: 'Normal', desc: 'Balanced, minimal issues', emoji: '✨' },
  { value: 'sensitive', label: 'Sensitive', desc: 'Reacts easily, prone to redness', emoji: '🌸' },
]

const FITZPATRICK = [
  { scale: 1, label: 'Type I', desc: 'Pale white, always burns', color: '#f5e6d3' },
  { scale: 2, label: 'Type II', desc: 'White, usually burns', color: '#e8c9a8' },
  { scale: 3, label: 'Type III', desc: 'Medium white/olive', color: '#c8956c' },
  { scale: 4, label: 'Type IV', desc: 'Moderate brown', color: '#a0714f' },
  { scale: 5, label: 'Type V', desc: 'Dark brown', color: '#6b4226' },
  { scale: 6, label: 'Type VI', desc: 'Deeply pigmented', color: '#3b2314' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [stepIndex, setStepIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [skinType, setSkinType] = useState<SkinType | ''>('')
  const [concerns, setConcerns] = useState<string[]>([])
  const [allergies, setAllergies] = useState('')
  const [sensitivities, setSensitivities] = useState('')
  const [fitzpatrick, setFitzpatrick] = useState<number>(0)
  const [dermatologist, setDermatologist] = useState(false)
  const [disclaimerAck, setDisclaimerAck] = useState(false)

  const step = STEPS[stepIndex]
  const progress = (stepIndex / (STEPS.length - 1)) * 100

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex(i => i + 1)
  }
  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(i => i - 1)
  }

  const handleComplete = async () => {
    if (!disclaimerAck) { setError('Please acknowledge the disclaimer to continue.'); return }
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Save skin profile
      await supabase.from('skin_profiles').upsert({
        user_id: user.id,
        skin_type: skinType || undefined,
        primary_concerns: concerns,
        known_allergies: allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        known_sensitivities: sensitivities ? sensitivities.split(',').map(s => s.trim()).filter(Boolean) : [],
        fitzpatrick_scale: fitzpatrick || undefined,
        dermatologist_care: dermatologist,
      })

      // Mark onboarding complete
      await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id)

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-skin-50 flex flex-col">
      {/* Progress */}
      <div className="fixed top-0 inset-x-0 z-50 bg-skin-50/80 backdrop-blur-md px-6 pt-4 pb-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-full bg-skin-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1 progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-charcoal-500 shrink-0 font-mono">
            {stepIndex + 1}/{STEPS.length}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 pt-20 pb-8">

        {/* WELCOME */}
        {step === 'welcome' && (
          <div className="flex-1 flex flex-col justify-center animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-skin-500 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-4xl font-light text-charcoal-900 mb-4">
              Let's set up your{' '}
              <em className="text-skin-500">skin profile</em>
            </h1>
            <p className="text-charcoal-600 font-body leading-relaxed mb-6">
              We'll ask a few questions to personalise your experience. This takes about 2 minutes.
            </p>
            <div className="disclaimer-box mb-6">
              <p className="font-semibold text-charcoal-800 mb-1">⚠️ Please read</p>
              <p>SkinProof is a personal skin tracking tool, not a medical device. AI analysis does not constitute
              medical diagnosis. Always consult a licensed dermatologist for skin health concerns.</p>
            </div>
          </div>
        )}

        {/* SKIN TYPE */}
        {step === 'skin_type' && (
          <div className="flex-1 animate-fade-up">
            <h2 className="font-display text-3xl font-light text-charcoal-900 mb-2">What's your skin type?</h2>
            <p className="text-charcoal-500 text-sm mb-6 font-body">Select the option that best describes your skin.</p>
            <div className="space-y-2">
              {SKIN_TYPES.map(({ value, label, desc, emoji }) => (
                <button
                  key={value}
                  onClick={() => setSkinType(value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    skinType === value
                      ? 'border-skin-400 bg-skin-50 shadow-sm'
                      : 'border-skin-100 bg-white hover:border-skin-200'
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-charcoal-900">{label}</p>
                    <p className="text-xs text-charcoal-500 font-body">{desc}</p>
                  </div>
                  {skinType === value && (
                    <Check className="w-5 h-5 text-skin-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONCERNS */}
        {step === 'concerns' && (
          <div className="flex-1 animate-fade-up">
            <h2 className="font-display text-3xl font-light text-charcoal-900 mb-2">What are your main concerns?</h2>
            <p className="text-charcoal-500 text-sm mb-6 font-body">Select all that apply.</p>
            <div className="flex flex-wrap gap-2">
              {SKIN_CONCERNS.map(concern => {
                const selected = concerns.includes(concern)
                return (
                  <button
                    key={concern}
                    onClick={() => setConcerns(prev =>
                      selected ? prev.filter(c => c !== concern) : [...prev, concern]
                    )}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      selected
                        ? 'bg-skin-500 text-white border-skin-500 shadow-sm'
                        : 'bg-white text-charcoal-700 border-skin-200 hover:border-skin-400'
                    }`}
                  >
                    {skinConcernLabel(concern)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ALLERGIES */}
        {step === 'allergies' && (
          <div className="flex-1 animate-fade-up">
            <h2 className="font-display text-3xl font-light text-charcoal-900 mb-2">Known allergies &amp; sensitivities</h2>
            <p className="text-charcoal-500 text-sm mb-6 font-body">
              This helps us flag potentially irritating ingredients in products.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Known allergies <span className="text-charcoal-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  placeholder="e.g. fragrance, lanolin, latex"
                  className="w-full px-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 font-body text-sm"
                />
                <p className="text-xs text-charcoal-400 mt-1">Separate with commas</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Sensitivities <span className="text-charcoal-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={sensitivities}
                  onChange={e => setSensitivities(e.target.value)}
                  placeholder="e.g. retinol, AHA, essential oils"
                  className="w-full px-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 font-body text-sm"
                />
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-skin-100">
                <input
                  type="checkbox"
                  id="derm"
                  checked={dermatologist}
                  onChange={e => setDermatologist(e.target.checked)}
                  className="w-4 h-4 rounded accent-skin-500"
                />
                <label htmlFor="derm" className="text-sm text-charcoal-700 font-body">
                  I'm currently under dermatologist care
                </label>
              </div>
            </div>
          </div>
        )}

        {/* FITZPATRICK */}
        {step === 'fitzpatrick' && (
          <div className="flex-1 animate-fade-up">
            <h2 className="font-display text-3xl font-light text-charcoal-900 mb-2">Fitzpatrick skin tone</h2>
            <p className="text-charcoal-500 text-sm mb-1 font-body">
              This helps calibrate AI analysis accuracy for your skin tone.
            </p>
            <p className="text-xs text-charcoal-400 mb-6 font-body">
              Optional — skip if unsure
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FITZPATRICK.map(({ scale, label, desc, color }) => (
                <button
                  key={scale}
                  onClick={() => setFitzpatrick(scale === fitzpatrick ? 0 : scale)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    fitzpatrick === scale
                      ? 'border-skin-400 bg-skin-50'
                      : 'border-skin-100 bg-white hover:border-skin-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full shrink-0 border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-charcoal-900">{label}</p>
                    <p className="text-xs text-charcoal-500 truncate font-body">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DISCLAIMER */}
        {step === 'disclaimer' && (
          <div className="flex-1 animate-fade-up">
            <h2 className="font-display text-3xl font-light text-charcoal-900 mb-4">
              Before we continue
            </h2>
            <div className="bg-white rounded-2xl border border-skin-200 p-5 mb-4 space-y-3">
              {[
                'SkinProof is a personal skin tracking tool, not a medical device.',
                'AI skin analysis results are for informational tracking purposes only.',
                'Results do not constitute a medical diagnosis or professional assessment.',
                'Always consult a licensed dermatologist or healthcare provider for medical advice.',
                'Product recommendations are ranked by skin compatibility, never by affiliate commission.',
                'Affiliate relationships with retailers are clearly disclosed.',
              ].map((point, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-skin-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-skin-600 text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-charcoal-700 font-body leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={disclaimerAck}
                onChange={e => setDisclaimerAck(e.target.checked)}
                className="w-4 h-4 rounded accent-skin-500 mt-0.5"
              />
              <span className="text-sm text-charcoal-700 font-body leading-relaxed">
                I understand and acknowledge that SkinProof is not a medical tool.
                I will consult a healthcare professional for any medical skin concerns.
              </span>
            </label>
            {error && (
              <p className="text-red-600 text-sm mt-3 font-body">{error}</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {stepIndex > 0 && step !== 'done' && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-skin-200 text-charcoal-700 font-medium hover:bg-skin-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {step === 'disclaimer' ? (
            <button
              onClick={handleComplete}
              disabled={loading || !disclaimerAck}
              className="flex-1 flex items-center justify-center gap-2 bg-skin-500 text-white py-3 rounded-xl font-medium hover:bg-skin-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Complete setup
            </button>
          ) : step !== 'done' && (
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 bg-skin-500 text-white py-3 rounded-xl font-medium hover:bg-skin-600 transition-all"
            >
              {step === 'welcome' ? "Let's go" : 'Continue'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
