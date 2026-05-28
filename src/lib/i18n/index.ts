import { en } from './en'
import { zhTW } from './zh-TW'

export type Lang = 'en' | 'zh-TW'

export function getTranslations(lang: string) {
  if (lang === 'zh-TW') return zhTW
  return en
}

export { en, zhTW }
export const t = en  // default export for direct import
