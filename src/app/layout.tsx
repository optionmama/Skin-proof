import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'

export const metadata: Metadata = {
  title: {
    default: 'SkinProof — AI Skin Tracker',
    template: '%s | SkinProof',
  },
  description: 'Track your skin daily, log products, and discover what actually works for your skin. Track. Discover. Glow.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SkinProof',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'SkinProof',
    description: 'AI-powered skin health tracker and product diary',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#cc6b47',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="grain-overlay min-h-screen bg-skin-50">
        <ServiceWorkerRegistration />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
