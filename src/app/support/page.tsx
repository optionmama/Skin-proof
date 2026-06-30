'use client'

import Link from 'next/link'
import { ArrowLeft, LifeBuoy, Mail } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

// Public support page — no login required. Reachable at /support and rendered in
// the user's language via the app-wide LanguageProvider (cookie/localStorage).
const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'zh-CN', label: '简体中文' },
] as const

const SUPPORT_EMAIL = 'support@skinproof.app'

export default function SupportPage() {
  const { t, lang, setLang } = useLanguage()

  const faq = [
    { q: t('support_q_delete'),  a: t('support_a_delete') },
    { q: t('support_q_scoring'), a: t('support_a_scoring') },
    { q: t('support_q_lang'),    a: t('support_a_lang') },
  ]

  return (
    <div className="min-h-screen bg-skin-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8 safe-area-pt safe-area-pb">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-charcoal-500 hover:text-charcoal-800 mb-8"
        >
          <ArrowLeft size={16} /> SkinProof
        </Link>

        <div className="space-y-7">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-skin-100 flex items-center justify-center">
                <LifeBuoy size={18} className="text-skin-600" />
              </div>
              <h1 className="font-display text-3xl text-charcoal-800">SkinProof — {t('support_title')}</h1>
            </div>
            <p className="text-sm text-charcoal-600 leading-relaxed">{t('support_intro')}</p>
          </div>

          {/* Language switcher */}
          <div className="flex flex-wrap gap-2">
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  lang === l.code ? 'bg-skin-500 text-white border-skin-500' : 'bg-white text-charcoal-700 border-skin-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Contact */}
          <div className="bg-white border border-skin-100 rounded-2xl p-5">
            <p className="text-sm font-semibold text-charcoal-800 mb-1.5">{t('support_contact')}</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-2 text-sm text-skin-600 font-medium">
              <Mail size={15} /> {SUPPORT_EMAIL}
            </a>
          </div>

          {/* FAQ */}
          <div className="space-y-3">
            <h2 className="font-display text-xl text-charcoal-800">{t('support_faq')}</h2>
            {faq.map((item, i) => (
              <div key={i} className="bg-white border border-skin-100 rounded-2xl p-5">
                <p className="text-sm font-semibold text-charcoal-800 mb-1.5">{item.q}</p>
                <p className="text-sm text-charcoal-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
