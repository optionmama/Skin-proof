'use client'

import { useEffect } from 'react'

// The iOS app loads the live site via Capacitor `server.url`, so a service
// worker that caches the app shell only causes "deployed but the app still
// shows the old version" confusion. Instead of registering one, proactively
// UNREGISTER any previously-installed SW and clear its caches so web updates
// always take effect immediately.
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {})
    }
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {})
    }
  }, [])

  return null
}
