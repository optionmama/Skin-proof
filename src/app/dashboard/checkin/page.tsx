'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Camera, Upload, Check, Loader2, AlertTriangle, Sparkles,
  Droplets, Zap, Flame, Cloud, Moon, Heart
} from 'lucide-react'
import { DISCLAIMER_TEXT } from '@/lib/utils'

type PhotoAngle = 'front' | 'left' | 'right' | 'forehead' | 'chin'

export default function CheckinPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'photo' | 'feelings' | 'habits' | 'submitting' | 'done'>('photo')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoAngle, setPhotoAngle] = useState<PhotoAngle>('front')
  const [disclaimerAck, setDisclaimerAck] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Feelings
  const [overallFeeling, setOverallFeeling] = useState(5)
  const [hydration, setHydration] = useState(5)
  const [oiliness, setOiliness] = useState(5)
  const [redness, setRedness] = useState(3)
  const [breakouts, setBreakouts] = useState(0)

  // Habits
  const [stressLevel, setStressLevel] = useState(5)
  const [sleepHours, setSleepHours] = useState(7)
  const [waterIntake, setWaterIntake] = useState(2000)
  const [notes, setNotes] = useState('')

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10MB.'); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError('')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    setStep('submitting')
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const today = new Date().toISOString().split('T')[0]

      // Create or update check-in
      const { data: checkin, error: checkinError } = await supabase
        .from('skin_checkins')
        .upsert({
          user_id: user.id,
          checkin_date: today,
          overall_feeling: overallFeeling,
          hydration_level: hydration,
          oiliness_level: oiliness,
          redness_level: redness,
          breakout_count: breakouts,
          stress_level: stressLevel,
          sleep_hours: sleepHours,
          water_intake_ml: waterIntake,
          notes: notes || null,
        }, { onConflict: 'user_id,checkin_date' })
        .select()
        .single()

      if (checkinError) throw checkinError

      // Upload photo if provided
      if (photoFile && checkin) {
        const ext = photoFile.name.split('.').pop() || 'jpg'
        const path = `${user.id}/${today}/${photoAngle}-${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('skin-photos')
          .upload(path, photoFile, { upsert: true })

        if (uploadError) throw uploadError

        await supabase.from('skin_photos').insert({
          user_id: user.id,
          checkin_id: checkin.id,
          storage_path: path,
          photo_angle: photoAngle,
          user_acknowledged_disclaimer: disclaimerAck,
        })
      }

      setStep('done')
      setTimeout(() => router.push('/dashboard/scan'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStep('habits')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'submitting') {
    return (
      <div className="min-h-screen bg-skin-50 flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-skin-500 flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-light text-charcoal-900 mb-2">Saving your check-in…</h2>
          <p className="text-charcoal-500 text-sm font-body">Uploading photo and syncing data</p>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-skin-50 flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-sage-500 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-light text-charcoal-900 mb-2">Check-in saved!</h2>
          <p className="text-charcoal-500 text-sm font-body">Running AI analysis…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl font-light text-charcoal-900">Today's check-in</h1>
          <p className="text-charcoal-500 text-sm font-body">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Step tabs */}
      <div className="flex gap-1 bg-skin-100 rounded-xl p-1 mb-6">
        {(['photo', 'feelings', 'habits'] as const).map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
              step === s ? 'bg-white text-charcoal-900 shadow-sm' : 'text-charcoal-500'
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* PHOTO STEP */}
      {step === 'photo' && (
        <div className="space-y-4 animate-fade-in">
          {/* Upload area */}
          {!photoPreview ? (
            <div
              className="upload-zone rounded-2xl p-8 text-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onDragEnter={e => (e.currentTarget.classList.add('drag-over'))}
              onDragLeave={e => (e.currentTarget.classList.remove('drag-over'))}
            >
              <div className="w-14 h-14 rounded-2xl bg-skin-100 flex items-center justify-center mx-auto mb-3">
                <Camera className="w-7 h-7 text-skin-500" />
              </div>
              <p className="font-medium text-charcoal-800 mb-1">Upload skin photo</p>
              <p className="text-sm text-charcoal-500 font-body">Tap to select or drag & drop</p>
              <p className="text-xs text-charcoal-400 mt-2 font-body">JPG, PNG, HEIC · Max 10MB</p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-charcoal-900">
              <img src={photoPreview} alt="Skin photo preview" className="w-full h-64 object-cover" />
              <button
                onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                className="absolute top-3 right-3 bg-charcoal-900/70 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs backdrop-blur"
              >
                ✕
              </button>
              <div className="absolute bottom-3 left-3 bg-charcoal-900/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur font-body">
                📸 {photoFile?.name}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Photo angle selector */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">Photo angle</label>
            <div className="flex gap-2 flex-wrap">
              {(['front', 'left', 'right', 'forehead', 'chin'] as PhotoAngle[]).map(angle => (
                <button
                  key={angle}
                  onClick={() => setPhotoAngle(angle)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                    photoAngle === angle
                      ? 'bg-skin-500 text-white border-skin-500'
                      : 'bg-white text-charcoal-700 border-skin-200 hover:border-skin-300'
                  }`}
                >
                  {angle}
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-cream-50 border border-cream-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-charcoal-700 mb-2">📷 Photo tips for best AI analysis</p>
            <ul className="text-xs text-charcoal-600 space-y-1 font-body">
              <li>• Natural lighting (near a window) works best</li>
              <li>• Clean, bare skin — no makeup</li>
              <li>• Same angle and distance each time</li>
              <li>• Face fills at least 60% of the frame</li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="bg-white border border-skin-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={disclaimerAck}
                onChange={e => setDisclaimerAck(e.target.checked)}
                className="w-4 h-4 rounded accent-skin-500 mt-0.5 shrink-0"
              />
              <span className="text-xs text-charcoal-600 font-body leading-relaxed">
                I understand AI analysis is for <strong>personal tracking only</strong> and
                not medical diagnosis. I'll consult a dermatologist for medical concerns.
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-body">{error}</p>
            </div>
          )}

          <button
            onClick={() => setStep('feelings')}
            className="w-full bg-skin-500 text-white py-3.5 rounded-xl font-medium hover:bg-skin-600 transition-all active:scale-95"
          >
            Continue to feelings →
          </button>
        </div>
      )}

      {/* FEELINGS STEP */}
      {step === 'feelings' && (
        <div className="space-y-5 animate-fade-in">
          {[
            { label: 'Overall feeling', icon: Heart, value: overallFeeling, setter: setOverallFeeling, color: 'skin' },
            { label: 'Hydration', icon: Droplets, value: hydration, setter: setHydration, color: 'sage' },
            { label: 'Oiliness', icon: Zap, value: oiliness, setter: setOiliness, color: 'cream' },
            { label: 'Redness', icon: Flame, value: redness, setter: setRedness, color: 'skin' },
          ].map(({ label, icon: Icon, value, setter, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-charcoal-500" />
                  <span className="text-sm font-medium text-charcoal-800">{label}</span>
                </div>
                <span className={`font-display text-lg font-medium text-${color}-500`}>{value}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={value}
                onChange={e => setter(Number(e.target.value))}
                className="w-full accent-skin-500"
              />
              <div className="flex justify-between text-xs text-charcoal-400 mt-1 font-body">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          ))}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-charcoal-800">Active breakouts</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setBreakouts(Math.max(0, breakouts - 1))} className="w-7 h-7 rounded-full border border-skin-200 flex items-center justify-center text-charcoal-600 hover:bg-skin-50">−</button>
                <span className="font-display text-lg w-6 text-center text-skin-500">{breakouts}</span>
                <button onClick={() => setBreakouts(breakouts + 1)} className="w-7 h-7 rounded-full border border-skin-200 flex items-center justify-center text-charcoal-600 hover:bg-skin-50">+</button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('habits')}
            className="w-full bg-skin-500 text-white py-3.5 rounded-xl font-medium hover:bg-skin-600 transition-all"
          >
            Continue to habits →
          </button>
        </div>
      )}

      {/* HABITS STEP */}
      {step === 'habits' && (
        <div className="space-y-5 animate-fade-in">
          {[
            { label: 'Stress level', icon: Cloud, value: stressLevel, setter: setStressLevel },
          ].map(({ label, icon: Icon, value, setter }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-charcoal-500" />
                  <span className="text-sm font-medium text-charcoal-800">{label}</span>
                </div>
                <span className="font-display text-lg font-medium text-skin-500">{value}</span>
              </div>
              <input type="range" min={1} max={10} value={value} onChange={e => setter(Number(e.target.value))} className="w-full accent-skin-500" />
            </div>
          ))}

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-charcoal-500" />
                <span className="text-sm font-medium text-charcoal-800">Sleep hours</span>
              </div>
              <span className="font-display text-lg font-medium text-skin-500">{sleepHours}h</span>
            </div>
            <input type="range" min={0} max={12} step={0.5} value={sleepHours} onChange={e => setSleepHours(Number(e.target.value))} className="w-full accent-skin-500" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-charcoal-500" />
                <span className="text-sm font-medium text-charcoal-800">Water intake</span>
              </div>
              <span className="font-display text-lg font-medium text-skin-500">{waterIntake}ml</span>
            </div>
            <input type="range" min={0} max={4000} step={250} value={waterIntake} onChange={e => setWaterIntake(Number(e.target.value))} className="w-full accent-skin-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">Notes <span className="text-charcoal-400 font-normal">(optional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anything notable about today? New product, weather, diet changes…"
              rows={3}
              className="w-full px-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 font-body text-sm resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-body">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || (!!photoFile && !disclaimerAck)}
            className="w-full flex items-center justify-center gap-2 bg-skin-500 text-white py-3.5 rounded-xl font-medium hover:bg-skin-600 transition-all disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save check-in
          </button>

          {photoFile && !disclaimerAck && (
            <p className="text-xs text-center text-charcoal-500 font-body">
              Please acknowledge the disclaimer on the photo tab to continue.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
