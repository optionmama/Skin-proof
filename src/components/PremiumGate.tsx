'use client'

import { ReactNode } from 'react'
import { useEntitlement } from '@/lib/entitlement/useEntitlement'

/**
 * Wraps a feature intended to be premium. Renders `children` when the user is
 * entitled. Today `is_premium` defaults to TRUE for everyone, so this always
 * renders the feature — it's structural groundwork, not an active paywall.
 *
 * While entitlement loads, we render `children` (no flash, no locked state).
 * If a user is somehow NOT premium, we render `fallback` when provided, else
 * still render `children` — because there is no payment flow to send them to
 * yet. When monetization launches, pass a paywall element as `fallback`.
 */
export function PremiumGate({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const { isPremium, loading } = useEntitlement()

  // TODO: paywall UI when monetization launches
  if (loading || isPremium) return <>{children}</>
  return <>{fallback ?? children}</>
}
