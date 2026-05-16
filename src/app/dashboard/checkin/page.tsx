'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Camera, Check, Loader2, AlertTriangle, Sparkles,
  Droplets, Cloud, Moon
} from 'lucide-react'

export default function CheckinPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'photo' | 'habits' | 'submitting' | 'done'>('photo')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [disclaimerAck, setDisclaimerAck] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data:image/xxx;base64, prefix
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

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
          stress_level: stressLevel,
          sleep_hours: sleepHours,
          water_intake_ml: waterIntake,
          notes: notes || null,
        }, { onConflict: 'user_id,checkin_date' })
        .select()
        .single()

      if (checkinError) throw checkinError

      // Upload photo and trigger AI analysis
      if (photoFile && checkin) {
        const ext = photoFile.name.split('.').pop() || 'jpg'
        const path = `${user.id}/${today}/front-${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('skin-photos')
          .upload(path, photoFile, { upsert: true })

        if (uploadError) throw uploadError

        // Insert photo record
        const { data: photoRecord, error: photoInsertError } = await supabase
          .from('skin_photos')
          .insert({
            user_id: user.id,
            checkin_id: checkin.id,
            storage_path: path,
            photo_angle: 'front',
            user_acknowledged_disclaimer: disclaimerAck,
          })
          .select()
          .single()

        if (photoInsertError) throw photoInsertError

        // Convert image to base64 for AI analysis
        if (photoRecord && disclaimerAck) {
          const image_base64 = await fileToBase64(photoFile)

          await fetch('/api/analyze-skin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photo_id: photoRecord.id,
              image_base64,
              acknowledged_disclaimer: true,
            }),
          })
        }
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
          <h2 className="font-display text-2xl font-light text-charcoal-900 mb-2">AI is analysing your skin...</h2>
          <p className="text-charcoal-500 text-sm font-body">請稍候，通常需要 15–30 秒</p>
          <p className="text-charcoal-400 text-xs font-body mt-1">Please wait, this takes 15–30 seconds</p>
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
      <div className="mb-6">
        <h1 className="font-display text-3xl font-light text-charcoal-900">Today's check-in</h1>
        <p className="text-charcoal-500 text-sm font-body">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Step tabs */}
      <div className="flex gap-1 bg-skin-100 rounded-xl p-1 mb-6">
        {(['photo', 'habits'] as const).map((s, i) => (
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
          {!photoPreview ? (
            <div
              className="upload-zone rounded-2xl p-8 text-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
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
            onClick={() => setStep('habits')}
            className="w-full bg-skin-500 text-white py-3.5 rounded-xl font-medium hover:bg-skin-600 transition-all active:scale-95"
          >
            Continue to habits →
          </button>
        </div>
      )}

      {/* HABITS STEP */}
      {step === 'habits' && (
        <div className="space-y-5 animate-fade-in">
          {/* Stress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-charcoal-500" />
                <span className="text-sm font-medium text-charcoal-800">Stress level</span>
              </div>
              <span className="font-display text-lg font-medium text-skin-500">{stressLevel}</span>
            </div>
            <input
              type="range" min={1} max={10} value={stressLevel}
              onChange={e => setStressLevel(Number(e.target.value))}
              className="w-full accent-skin-500"
            />
            <div className="flex justify-between text-xs text-charcoal-400 mt-1 font-body">
              <span>Low</span><span>High</span>
            </div>
          </div>

          {/* Sleep */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-charcoal-500" />
                <span className="text-sm font-medium text-charcoal-800">Sleep hours</span>
              </div>
              <span className="font-display text-lg font-medium text-skin-500">{sleepHours}h</span>
            </div>
            <input
              type="range" min={0} max={12} step={0.5} value={sleepHours}
              onChange={e => setSleepHours(Number(e.target.value))}
              className="w-full accent-skin-500"
            />
          </div>

          {/* Water */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-charcoal-500" />
                <span className="text-sm font-medium text-charcoal-800">Water intake</span>
              </div>
              <span className="font-display text-lg font-medium text-skin-500">{waterIntake}ml</span>
            </div>
            <input
              type="range" min={0} max={4000} step={250} value={waterIntake}
              onChange={e => setWaterIntake(Number(e.target.value))}
              className="w-full accent-skin-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Notes <span className="text-charcoal-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anything notable today? New product, weather, diet changes…"
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
