'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'

const CATEGORIES: { value: string; key: TranslationKey }[] = [
  { value: 'Cleanser', key: 'cat_cleanser' }, { value: 'Toner', key: 'cat_toner' },
  { value: 'Serum', key: 'cat_serum' }, { value: 'Moisturiser', key: 'cat_moisturizer' },
  { value: 'Sunscreen', key: 'cat_sunscreen' }, { value: 'Eye Cream', key: 'cat_eye_cream' },
  { value: 'Treatment', key: 'cat_treatment' }, { value: 'Other', key: 'cat_other' },
]

export default function AddProductPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const ROUTINE_TYPES: { value: 'am' | 'pm' | 'both'; label: string }[] = [
    { value: 'am',   label: t('add_am') },
    { value: 'pm',   label: t('add_pm') },
    { value: 'both', label: t('add_both') },
  ]

  const [brand, setBrand]       = useState('')
  const [name, setName]         = useState('')
  const [category, setCategory] = useState('')
  const [routine, setRoutine]   = useState<'am' | 'pm' | 'both'>('am')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setError(t('add_name_required')); return }
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Insert into user_products
      const { data: product, error: productErr } = await supabase
        .from('user_products')
        .insert({
          user_id: user.id,
          brand: brand.trim() || null,
          name: name.trim(),
          category: category || null,
          is_active: true,
        })
        .select('id')
        .single()

      if (productErr || !product) throw productErr

      // Get current step_order for this routine type
      const { count } = await supabase
        .from('user_routines')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('routine_type', routine === 'both' ? 'am' : routine)
        .eq('is_active', true)

      // Insert into user_routines (once for 'both', twice for am/pm separately)
      const routineRows = routine === 'both'
        ? [
            { user_id: user.id, product_id: product.id, routine_type: 'am', step_order: (count || 0), is_active: true },
            { user_id: user.id, product_id: product.id, routine_type: 'pm', step_order: (count || 0), is_active: true },
          ]
        : [{ user_id: user.id, product_id: product.id, routine_type: routine, step_order: (count || 0), is_active: true }]

      const { error: routineErr } = await supabase.from('user_routines').insert(routineRows)
      if (routineErr) throw routineErr

      // Auto-fetch ingredients in the background (fire-and-forget)
      fetch('/api/lookup-product-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      }).catch(() => {})

      setSaved(true)
      setTimeout(() => router.push('/dashboard/diary'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('add_save_failed'))
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-skin-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-sage-500 mx-auto" />
          <p className="font-display text-2xl font-light text-charcoal-900">{t('add_success')}</p>
          <p className="text-sm text-charcoal-500 font-body">{t('add_returning')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-skin-50">
      {/* Header */}
      <div className="bg-white border-b border-skin-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/dashboard/diary" className="p-2 hover:bg-skin-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-charcoal-600" />
        </Link>
        <h1 className="font-display text-2xl font-light text-charcoal-900">{t('add_title')}</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-2">
            {t('add_brand')} <span className="text-charcoal-400 font-normal">{t('add_optional')}</span>
          </label>
          <input
            type="text"
            value={brand}
            onChange={e => setBrand(e.target.value)}
            placeholder={t('add_brand_ph')}
            className="w-full px-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 font-body text-sm"
          />
        </div>

        {/* Product name */}
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-2">
            {t('add_name')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            placeholder={t('add_name_ph')}
            className="w-full px-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 font-body text-sm"
            autoFocus
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-2">
            {t('add_category')} <span className="text-charcoal-400 font-normal">{t('add_optional')}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(category === c.value ? '' : c.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  category === c.value
                    ? 'bg-skin-500 text-white border-skin-500'
                    : 'bg-white text-charcoal-700 border-skin-200 hover:border-skin-300'
                }`}
              >
                {t(c.key)}
              </button>
            ))}
          </div>
        </div>

        {/* Routine */}
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-2">
            {t('add_to_routine')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ROUTINE_TYPES.map(r => (
              <button
                key={r.value}
                onClick={() => setRoutine(r.value as 'am' | 'pm' | 'both')}
                className={`py-3 rounded-xl text-xs font-medium border transition-all ${
                  routine === r.value
                    ? 'bg-skin-500 text-white border-skin-500'
                    : 'bg-white text-charcoal-700 border-skin-200 hover:border-skin-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 font-body">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full flex items-center justify-center gap-2 bg-skin-500 text-white py-4 rounded-xl font-medium text-sm hover:bg-skin-600 transition-all disabled:opacity-60 active:scale-[0.98]"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('add_save')}
        </button>

        <p className="text-xs text-center text-charcoal-400 font-body">
          {t('add_helper')}
        </p>
      </div>
    </div>
  )
}
