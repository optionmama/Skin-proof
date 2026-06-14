'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

const VALID: Language[] = ['en', 'zh-TW', 'zh-CN']

function isValid(l: string | null | undefined): l is Language {
  return !!l && VALID.includes(l as Language)
}

/** The locale the server used for this render, read from the cookie at mount. */
function readCookieLang(): Language | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)skinproof_lang=([^;]+)/)
  return isValid(m?.[1]) ? (m![1] as Language) : null
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [lang, setLangState] = useState<Language>('en')

  const persistLocal = (l: Language) => {
    document.cookie = `skinproof_lang=${l}; path=/; max-age=31536000; SameSite=Lax`
    try { localStorage.setItem('skinproof_lang', l) } catch { /* ignore */ }
  }

  useEffect(() => {
    // What the server rendered with (null if first-ever visit / no cookie yet)
    const serverLang = readCookieLang()

    // Resolve the language we actually want on the client
    const saved = localStorage.getItem('skinproof_lang') as Language | null
    let initial: Language
    if (isValid(saved)) {
      initial = saved
    } else {
      const bl = navigator.language
      if (bl === 'zh-TW' || bl === 'zh-Hant' || bl.startsWith('zh-Hant')) initial = 'zh-TW'
      else if (bl.startsWith('zh')) initial = 'zh-CN'
      else initial = 'en'
    }

    setLangState(initial)
    persistLocal(initial)

    // If the server rendered server components in a different language than we
    // want, re-fetch them so the whole UI matches immediately (no hard reload).
    if ((serverLang ?? 'en') !== initial) {
      router.refresh()
    }

    // Supabase holds the authoritative saved preference — sync it if different
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('user_settings')
          .select('language')
          .eq('user_id', user.id)
          .single()
        const remote = data?.language as Language | undefined
        if (isValid(remote) && remote !== initial) {
          setLangState(remote)
          persistLocal(remote)
          router.refresh()
        }
      } catch { /* non-fatal */ }
    })()
  }, [])

  const setLang = (newLang: Language) => {
    if (!isValid(newLang)) return
    setLangState(newLang)
    persistLocal(newLang)
    // Re-render server components (home, scan, layouts) in the new language now.
    router.refresh()
    // Persist to Supabase in the background.
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('user_settings').upsert({ user_id: user.id, language: newLang })
        }
      } catch { /* non-fatal */ }
    })()
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
