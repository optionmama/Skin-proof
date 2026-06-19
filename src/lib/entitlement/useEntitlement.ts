'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Single source of truth for premium entitlement on the client.
 *
 * Reads `users.is_premium`, which currently defaults to TRUE for everyone — the
 * app is 100% free and every gated feature renders normally. This hook is the
 * structural seam: when monetization launches, the DB default flips to FALSE
 * and a payment flow grants TRUE, and nothing here needs to change.
 *
 * Fail-open: if the user/row/column can't be read, we treat the user as
 * entitled so a transient error never hides a feature while everything is free.
 */
export function useEntitlement(): { isPremium: boolean; loading: boolean } {
  const [isPremium, setIsPremium] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return // keep default-allow
        const { data } = await supabase
          .from('users')
          .select('is_premium')
          .eq('id', user.id)
          .single()
        if (!cancelled) setIsPremium((data?.is_premium as boolean | undefined) ?? true)
      } catch {
        // fail-open
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return { isPremium, loading }
}
