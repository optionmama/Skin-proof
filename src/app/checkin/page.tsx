'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, Droplets, Moon, Zap, CheckCircle2, Loader2 } from 'lucide-react'
import ProductsStep, { CheckinProduct } from '@/components/checkin/ProductsStep'

interface HabitsData {
  sleep_hours: number
  water_intake_ml: number
  stress_level: number
  notes: string
}

const STEPS = [
  { key: 'photo',    label: 'Photo',    icon: Camera },
  { key: 'habits',   label: 'Habits',   icon: Moon },
  { key: 'products', label: 'Products', icon: Droplets },
]

export default function CheckinPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(0)
  const [photoId, setPhotoId] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [habits, setHabits] = useState<HabitsData>({
    sleep_hours: 7, water_intake_ml: 1500, stress_level: 3, notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePhotoCapture = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1]
      setImageBase64(base64)
      const date = new Date().toISOString().split('T')[0]
      const path = `${user.id}/${date}/front-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage.from('skin-photos').upload(path, file)
      if (!uploadError) {
        const { data: photo } = await supabase
          .from('skin_photos')
          .insert({ user_id: user.id, storage_path: path, photo_date: new Date().toISOString() })
          .select('id').single()
        if (photo) setPhotoId(photo.id)
      }
    }
    reader.readAsDataURL(file)
    setCurrentStep(1)
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
      const { data: checkin, error: checkinError } = await supabase
        .from('skin_checkins')
        .insert({
          user_id: user.id,
          photo_id: photoId,
          sleep_hours: habits.sleep_hours,
          water_intake_ml: habits.water_intake_ml,
          stress_level: habits.stress_level,
          notes: habits.notes,
          checked_in_at: new Date().toISOString(),
        })
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
      if (photoId && imageBase64) {
        fetch('/api/analyze-skin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_id: photoId, image_base64: imageBase64, acknowledged_disclaimer: true }),
        })
      }
      router.push(`/dashboard/checkin/result?checkin_id=${checkin.id}`)
    } catch (err: any) {
      setError(err.message ?? '提交失敗，請稍後再試')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
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
        {currentStep === 0 && <PhotoStep onCapture={handlePhotoCapture} />}
        {currentStep === 1 && (
          <HabitsStep data={habits} onChange={setHabits}
            onNext={() => setCurrentStep(2)} onBack={() => setCurrentStep(0)} />
        )}
        {currentStep === 2 && (
          <ProductsStep onComplete={handleProductsComplete} onBack={() => setCurrentStep(1)} />
        )}
      </div>

      {submitting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-50">
          <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
          <p className="text-stone-600 font-medium">正在分析中...</p>
          <p className="text-stone-400 text-sm">AI 正在分析你的膚況</p>
        </div>
      )}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}

function PhotoStep({ onCapture }: { onCapture: (file: File) => void }) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onCapture(file)
  }
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-6">
      <div className="w-32 h-32 rounded-full bg-rose-50 flex items-center justify-center">
        <Camera className="w-12 h-12 text-rose-300" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-stone-800">拍今天的臉</h2>
        <p className="text-sm text-stone-500 mt-2">自然光、正面、無妝</p>
      </div>
      <label className="w-full">
        <input type="file" accept="image/*" capture="user" onChange={handleFileChange} className="sr-only" />
        <div className="w-full py-4 bg-rose-400 text-white rounded-xl text-center font-medium cursor-pointer active:scale-[0.98] transition-all">
          📷 開啟相機
        </div>
      </label>
      <label className="w-full">
        <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
        <div className="w-full py-3 border border-stone-200 text-stone-600 rounded-xl text-center text-sm cursor-pointer">
          從相簿選取
        </div>
      </label>
    </div>
  )
}

function HabitsStep({ data, onChange, onNext, onBack }: {
  data: HabitsData; onChange: (d: HabitsData) => void; onNext: () => void; onBack: () => void
}) {
  const stressLabels = ['', '超輕鬆', '還好', '普通', '有點累', '壓力大']
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">今天的生活習慣</h2>
        <p className="text-sm text-stone-500 mt-0.5">這些資料幫助 AI 分析膚況變化的原因</p>
      </div>
      <div className="bg-white rounded-xl p-4 border border-stone-100">
        <div className="flex items-center gap-2 mb-3">
          <Moon className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-stone-700">昨晚睡幾小時？</span>
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
          <span className="text-sm font-medium text-stone-700">今天喝水量</span>
          <span className="ml-auto text-lg font-semibold text-stone-800">{data.water_intake_ml}ml</span>
        </div>
        <input type="range" min={500} max={3000} step={250} value={data.water_intake_ml}
          onChange={e => onChange({ ...data, water_intake_ml: parseInt(e.target.value) })}
          className="w-full accent-sky-400" />
        <div className="flex justify-between text-xs text-stone-300 mt-1">
          <span>少</span><span>1500ml</span><span>多</span>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 border border-stone-100">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-stone-700">今日壓力指數</span>
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
      <textarea placeholder="今天有什麼特別的事？（選填）" value={data.notes}
        onChange={e => onChange({ ...data, notes: e.target.value })} rows={2}
        className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-rose-300 bg-white resize-none" />
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-medium text-stone-600">← 返回</button>
        <button onClick={onNext} className="flex-1 py-3 bg-rose-400 text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-all">下一步 →</button>
      </div>
    </div>
  )
}
