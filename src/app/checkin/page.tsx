'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, Droplets, Moon, Zap, CheckCircle2, Loader2 } from 'lucide-react'
import ProductsStep, { CheckinProduct } from '@/components/checkin/ProductsStep'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import DashboardNav from '@/components/DashboardNav'
import { useEntitlement } from '@/lib/entitlement/useEntitlement'
import { isNativePlatform, captureNativePhoto, pickNativePhoto } from '@/lib/native/camera'
import { downscaleImage } from '@/lib/image'
import { setAnalysisPrewarm } from '@/lib/analysis-prewarm'
import { localDayKey } from '@/lib/day'

interface HabitsData {
  sleep_hours: number
  water_intake_ml: number
  stress_level: number
  notes: string
}

export default function CheckinPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t, lang } = useLanguage()
  // Unlimited scans is an intended premium feature. Premium = no cap; the free
  // tier would limit daily scans here. No cap is enforced while the app is free
  // (everyone is_premium), so scanning is always allowed today.
  // TODO: paywall UI when monetization launches
  const { isPremium } = useEntitlement()
  const FREE_DAILY_SCAN_LIMIT: number | null = null // null = unlimited for all
  const scanAllowed = isPremium || FREE_DAILY_SCAN_LIMIT === null

  const STEPS = [
    { key: 'photo',    label: t('checkin_step_photo'),    icon: Camera },
    { key: 'habits',   label: t('checkin_step_habits'),   icon: Moon },
    { key: 'products', label: t('checkin_step_products'), icon: Droplets },
  ]
  const [currentStep, setCurrentStep] = useState(0)
  const [photoId, setPhotoId] = useState<string | null>(null)
  // Holds the in-flight photo upload+insert so handleSubmit can AWAIT it before
  // creating the check-in. Without this, a fast user / slow network could submit
  // before the photo row existed → checkin.photo_id = null → analysis never ran.
  const uploadRef = useRef<Promise<string | null> | null>(null)
  const [habits, setHabits] = useState<HabitsData>({
    sleep_hours: 7, water_intake_ml: 1500, stress_level: 3, notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePhotoCapture = async (file: File) => {
    // Entitlement seam for unlimited scans — always allowed while the app is free.
    // TODO: paywall UI when monetization launches
    if (!scanAllowed) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // Advance the UI immediately, but KEEP the upload promise so submit can await
    // it — the photo row must exist before we link it to the check-in.
    setCurrentStep(1)
    const date = localDayKey() // user's LOCAL day, matching checkin_date
    const path = `${user.id}/${date}/front-${Date.now()}.jpg`
    uploadRef.current = (async () => {
      // Shrink on-device first (~1.8MB → ~200-400KB): faster upload, faster
      // server download, faster vision call. Falls back to the original file
      // on any failure, so this can never block a check-in.
      const upload = await downscaleImage(file)
      const { error: uploadError } = await supabase.storage.from('skin-photos').upload(path, upload)
      if (uploadError) return null
      const { data: photo } = await supabase
        .from('skin_photos')
        .insert({ user_id: user.id, storage_path: path })
        .select('id').single()
      const id = photo?.id ?? null
      if (id) {
        setPhotoId(id)
        // PRE-WARM the analysis while the user fills in the habits/products
        // steps — this page stays mounted, so the call is held by a live
        // component (R20-compliant). The result page AWAITS this same promise
        // via analysis-prewarm and only runs its own (retryable) call if this
        // one didn't land — so no duplicate analyze requests.
        setAnalysisPrewarm(id, fetch('/api/analyze-skin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_id: id, lang, acknowledged_disclaimer: true }),
        }).catch(() => undefined))
      }
      return id
    })()
  }

  const handleProductsComplete = (selectedProducts: CheckinProduct[]) => {
    handleSubmit(selectedProducts)
  }

  const handleSubmit = async (finalProducts: CheckinProduct[]) => {
    setSubmitting(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // The check-in belongs to the user's LOCAL calendar day (2026-07-10 fix:
      // the UTC date meant e.g. a 5 AM Taipei check-in was recorded to
      // yesterday and could overwrite yesterday's entry via the upsert below).
      const today = localDayKey()

      // Wait for the background photo upload to finish so we NEVER save a
      // check-in with a null photo_id (which silently skips analysis). This is
      // the root-cause fix for "無法分析你的照片" on slow mobile networks.
      const resolvedPhotoId = (await uploadRef.current) ?? photoId
      if (!resolvedPhotoId) throw new Error(t('checkin_submit_error'))

      const { data: checkin, error: checkinError } = await supabase
        .from('skin_checkins')
        .upsert({
          user_id: user.id,
          checkin_date: today,
          photo_id: resolvedPhotoId,
          sleep_hours: habits.sleep_hours,
          water_intake_ml: habits.water_intake_ml,
          stress_level: habits.stress_level,
          notes: habits.notes,
          checked_in_at: new Date().toISOString(),
        }, { onConflict: 'user_id,checkin_date' })
        .select('id').single()

      if (checkinError || !checkin) throw checkinError

      if (finalProducts.length > 0) {
        await supabase.from('checkin_products').insert(
          finalProducts.map(p => ({
            checkin_id: checkin.id,
            user_id: user.id,
            user_product_id: p.user_product_id,
            brand: p.brand,
            name: p.name,
            category: p.category,
            is_temporary: p.is_temporary,
            used_am: p.used_am,
            used_pm: p.used_pm,
          }))
        )
      }

      // NOTE: we intentionally do NOT trigger analysis here. A fire-and-forget
      // fetch was aborted by the navigation below (keepalive is unreliable in the
      // WebView), which is why scores kept going missing. The result page now
      // OWNS the analysis: it triggers /api/analyze-skin awaited, on a mounted
      // component that won't be torn down mid-request. See result/page.tsx.
      router.push(`/dashboard/checkin/result?checkin_id=${checkin.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('checkin_submit_error'))
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col pb-20 safe-area-pt">
      {/* Progress steps */}
      <div className="bg-white border-b border-stone-100 px-4 py-3">
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const isComplete = i < currentStep
            const isCurrent = i === currentStep
            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isComplete ? 'bg-rose-400 text-white' :
                    isCurrent  ? 'bg-rose-100 text-rose-500 ring-2 ring-rose-300' :
                                 'bg-stone-100 text-stone-300'
                  }`}>
                    {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-medium ${
                    isCurrent ? 'text-rose-500' : isComplete ? 'text-rose-400' : 'text-stone-300'
                  }`}>{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${
                    i < currentStep ? 'bg-rose-300' : 'bg-stone-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        {currentStep === 0 && <PhotoStep onCapture={handlePhotoCapture} t={t} />}
        {currentStep === 1 && (
          <HabitsStep data={habits} onChange={setHabits}
            onNext={() => setCurrentStep(2)} onBack={() => setCurrentStep(0)} t={t} />
        )}
        {currentStep === 2 && (
          <ProductsStep onComplete={handleProductsComplete} onBack={() => setCurrentStep(1)} />
        )}
      </div>

      {submitting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-50">
          <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
          <p className="text-stone-600 font-medium">{t('checkin_analysing')}</p>
          <p className="text-stone-400 text-sm">{t('checkin_analysing_sub')}</p>
        </div>
      )}

      {error && (
        <div className="fixed bottom-20 left-4 right-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <DashboardNav />
    </div>
  )
}

function PhotoStep({ onCapture, t }: { onCapture: (file: File) => void; t: (k: string) => string }) {
  // Detect the native shell on the client. When native, use the real device
  // camera/library via @capacitor/camera; on web/PWA keep the <input capture>
  // flow as the fallback. Either path hands a File to the same onCapture.
  const [native, setNative] = useState(false)
  useEffect(() => { isNativePlatform().then(setNative) }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onCapture(file)
  }

  const handleNativeCamera = async () => {
    try {
      const file = await captureNativePhoto()
      if (file) onCapture(file)
    } catch { /* user cancelled or unavailable — stay on this step */ }
  }
  const handleNativeLibrary = async () => {
    try {
      const file = await pickNativePhoto()
      if (file) onCapture(file)
    } catch { /* cancelled */ }
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-6">
      <div className="w-32 h-32 rounded-full bg-rose-50 flex items-center justify-center">
        <Camera className="w-12 h-12 text-rose-300" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-stone-800">{t('checkin_photo_title')}</h2>
        <p className="text-sm text-stone-500 mt-2">{t('checkin_photo_subtitle')}</p>
      </div>

      {native ? (
        <>
          <button onClick={handleNativeCamera}
            className="w-full py-4 bg-rose-400 text-white rounded-xl text-center font-medium cursor-pointer active:scale-[0.98] transition-all">
            📷 {t('checkin_open_camera')}
          </button>
          <button onClick={handleNativeLibrary}
            className="w-full py-3 border border-stone-200 text-stone-600 rounded-xl text-center text-sm cursor-pointer">
            {t('checkin_choose_library')}
          </button>
        </>
      ) : (
        <>
          <label className="w-full">
            <input type="file" accept="image/*" capture="user" onChange={handleFileChange} className="sr-only" />
            <div className="w-full py-4 bg-rose-400 text-white rounded-xl text-center font-medium cursor-pointer active:scale-[0.98] transition-all">
              📷 {t('checkin_open_camera')}
            </div>
          </label>
          <label className="w-full">
            <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
            <div className="w-full py-3 border border-stone-200 text-stone-600 rounded-xl text-center text-sm cursor-pointer">
              {t('checkin_choose_library')}
            </div>
          </label>
        </>
      )}
    </div>
  )
}

function HabitsStep({ data, onChange, onNext, onBack, t }: {
  data: HabitsData; onChange: (d: HabitsData) => void; onNext: () => void; onBack: () => void
  t: (k: string) => string
}) {
  const stressLabels = ['', t('checkin_stress_1'), t('checkin_stress_2'), t('checkin_stress_3'), t('checkin_stress_4'), t('checkin_stress_5')]
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">{t('checkin_habits_title')}</h2>
        <p className="text-sm text-stone-500 mt-0.5">{t('checkin_habits_subtitle')}</p>
      </div>

      <div className="bg-white rounded-xl p-4 border border-stone-100">
        <div className="flex items-center gap-2 mb-3">
          <Moon className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-stone-700">{t('checkin_habits_sleep')}</span>
          <span className="ml-auto text-lg font-semibold text-stone-800">{data.sleep_hours}h</span>
        </div>
        <input type="range" min={4} max={12} step={0.5} value={data.sleep_hours}
          onChange={e => onChange({ ...data, sleep_hours: parseFloat(e.target.value) })}
          className="w-full accent-indigo-400" />
        <div className="flex justify-between text-xs text-stone-300 mt-1">
          <span>4h</span><span>8h</span><span>12h</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-stone-100">
        <div className="flex items-center gap-2 mb-3">
          <Droplets className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-medium text-stone-700">{t('checkin_habits_water')}</span>
          <span className="ml-auto text-lg font-semibold text-stone-800">{data.water_intake_ml}ml</span>
        </div>
        <input type="range" min={500} max={3000} step={250} value={data.water_intake_ml}
          onChange={e => onChange({ ...data, water_intake_ml: parseInt(e.target.value) })}
          className="w-full accent-sky-400" />
        <div className="flex justify-between text-xs text-stone-300 mt-1">
          <span>{t('checkin_habits_water_low')}</span><span>1500ml</span><span>{t('checkin_habits_water_high')}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-stone-100">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-stone-700">{t('checkin_habits_stress')}</span>
          <span className="ml-auto text-sm text-stone-500">{stressLabels[data.stress_level]}</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => onChange({ ...data, stress_level: n })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                data.stress_level === n ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300' : 'bg-stone-100 text-stone-400'
              }`}>{n}</button>
          ))}
        </div>
      </div>

      <textarea placeholder={t('checkin_habits_notes')} value={data.notes}
        onChange={e => onChange({ ...data, notes: e.target.value })} rows={2}
        className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-rose-300 bg-white resize-none" />

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-medium text-stone-600">
          {t('checkin_habits_back')}
        </button>
        <button onClick={onNext}
          className="flex-1 py-3 bg-rose-400 text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-all">
          {t('checkin_habits_next')}
        </button>
      </div>
    </div>
  )
}
