'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export interface RoutineItem {
  id: string
  productId: string
  brand: string
  name: string
  category: string | null
  label: string
}

export default function RoutineList({ items }: { items: RoutineItem[] }) {
  const supabase = createClient()
  const router = useRouter()
  const { t } = useLanguage()
  const [confirmItem, setConfirmItem] = useState<RoutineItem | null>(null)
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    if (!confirmItem) return
    setRemoving(true)
    // Soft-delete all routine entries for this product (both AM and PM)
    await supabase
      .from('user_routines')
      .update({ is_active: false })
      .eq('product_id', confirmItem.productId)
    setConfirmItem(null)
    setRemoving(false)
    router.refresh()
  }

  return (
    <>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-skin-100">
            <div className="w-10 h-10 rounded-lg bg-skin-100 flex items-center justify-center text-skin-600 text-xs font-medium uppercase">
              {item.category?.slice(0, 2) || '??'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal-900 truncate">{item.name}</p>
              <p className="text-xs text-charcoal-500">{item.brand}</p>
            </div>
            <span className="text-xs text-charcoal-400 font-body shrink-0 mr-1">{item.label}</span>
            <button
              onClick={() => setConfirmItem(item)}
              className="p-1.5 text-charcoal-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
              aria-label="Remove from routine"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm bottom sheet */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm"
            onClick={() => setConfirmItem(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl px-5 pt-5 pb-8 space-y-4 animate-slide-up">
            <div className="w-10 h-1 bg-skin-200 rounded-full mx-auto mb-2" />
            <h3 className="font-display text-xl font-light text-charcoal-900">
              {t('routine_remove_title')}
            </h3>
            <p className="text-sm text-charcoal-600 font-body">
              <strong>{confirmItem.name}</strong> — {t('routine_remove_body')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmItem(null)}
                className="flex-1 py-3 border border-skin-200 rounded-xl text-sm font-medium text-charcoal-700 hover:bg-skin-50 transition-colors"
              >
                {t('general_cancel')}
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {removing ? t('general_removing') : t('general_remove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
