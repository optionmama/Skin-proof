import { cookies } from 'next/headers'
import { Language, TranslationKey, translate } from './translations'

export async function getServerLang(): Promise<Language> {
  const store = await cookies()
  const saved = store.get('skinproof_lang')?.value as Language | undefined
  return (saved && ['en', 'zh-TW', 'zh-CN'].includes(saved)) ? saved : 'en'
}

export async function getT() {
  const lang = await getServerLang()
  return (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(key, lang, vars)
}
