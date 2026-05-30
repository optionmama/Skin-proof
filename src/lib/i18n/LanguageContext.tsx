'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Language, TranslationKey, translate } from './translations'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    // Priority: localStorage > browser locale
    const saved = localStorage.getItem('skinproof_lang') as Language | null
    if (saved && ['en', 'zh-TW', 'zh-CN'].includes(saved)) {
      setLangState(saved)
    } else {
      const bl = navigator.language
      if (bl === 'zh-TW' || bl === 'zh-Hant' || bl.startsWith('zh-Hant')) setLangState('zh-TW')
      else if (bl.startsWith('zh')) setLangState('zh-CN')
      else setLangState('en')
    }
  }, [])

  const setLang = async (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('skinproof_lang', newLang)
    // Cookie for server components
    document.cookie = `skinproof_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`
    // Persist to Supabase
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('user_settings').upsert({ user_id: user.id, language: newLang })
      }
    } catch { /* non-fatal */ }
  }

  const t = (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(key, lang, vars)

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
