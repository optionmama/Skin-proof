'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Landing-page CTA. Gives immediate feedback on tap (disable + inline spinner)
 * so the button never feels dead while the next route loads, then navigates.
 */
export default function StartButton({
  href = '/auth',
  className,
  style,
  children,
}: {
  href?: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  return (
    <button
      type="button"
      onClick={() => { if (!loading) { setLoading(true); router.push(href) } }}
      disabled={loading}
      className={className}
      style={{
        fontFamily: 'inherit',
        border: 'none',
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.9 : 1,
        ...style,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        {loading && <Loader2 className="animate-spin" style={{ width: '1em', height: '1em' }} />}
        {children}
      </span>
    </button>
  )
}
