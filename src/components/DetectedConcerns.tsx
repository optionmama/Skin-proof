'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

// The Today's-Skin (scan) page's "detected concerns" card. To stay consistent
// with the For You page (which groups by deriveScanConcerns), the PRIMARY tags
// here are the same canonical, already-localized concern labels (e.g. 泛紅 /
// 痘痘), passed in as `concernLabels`. The AI's free-text observations (e.g.
// "額頭上有幾條細紋") are kept as smaller supporting detail — they're stored in
// whatever language the scan ran in, so this client component localizes them on
// display (same behaviour as the result page) to avoid half-English/half-Chinese.
// Kept self-contained so the working result-page translation path is untouched.
const CJK = /[一-鿿]/
const TRAD_ONLY = /[們這個時為點觀區應乾發顯潤質紋較鬆樣現會臉裡邊額顆頰兩過細緊澤對開閉變問頭診療膚紅塊澀勻癢]/
const SIMP_ONLY = /[们这个时为点观区应干发显润质纹较松样现会脸里边额颗颊两过细紧泽对开闭变问头诊疗肤红块涩匀痒]/

function detectLang(text: string): 'en' | 'zh-TW' | 'zh-CN' | 'zh' {
  if (!CJK.test(text)) return 'en'
  const trad = TRAD_ONLY.test(text)
  const simp = SIMP_ONLY.test(text)
  if (trad && !simp) return 'zh-TW'
  if (simp && !trad) return 'zh-CN'
  return 'zh'
}

export default function DetectedConcerns({
  concernLabels = [],
  observations,
}: {
  concernLabels?: string[]
  observations: string[]
}) {
  const { t, lang } = useLanguage()
  const [display, setDisplay] = useState<string[]>(observations)
  const cacheRef = useRef<{ key: string; map: Record<string, string[]> }>({ key: '', map: {} })

  useEffect(() => {
    if (!observations || observations.length === 0) { setDisplay([]); return }

    const cacheKey = observations.join('|||')
    if (cacheRef.current.key !== cacheKey) {
      const detected = detectLang(observations.join(' '))
      const seed: Record<string, string[]> = {}
      if (detected === 'en') seed['en'] = observations
      else if (detected === 'zh') { seed['zh-TW'] = observations; seed['zh-CN'] = observations }
      else seed[detected] = observations
      cacheRef.current = { key: cacheKey, map: seed }
    }

    const cache = cacheRef.current.map
    if (cache[lang]) { setDisplay(cache[lang]); return }

    let cancelled = false
    setDisplay(observations) // show stored text immediately, swap when ready
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: observations, targetLang: lang }),
    })
      .then(r => r.json())
      .then((res: { texts?: string[] }) => {
        if (cancelled || !res.texts?.length) return
        cacheRef.current.map[lang] = res.texts
        setDisplay(res.texts)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [observations, lang])

  const hasConcerns = concernLabels.length > 0
  const hasDetail = display.length > 0
  if (!hasConcerns && !hasDetail) return null

  // Canonical concern tags lead (identical to what For You groups by). If none
  // could be derived, fall back to showing the free-text as the chips so the
  // card is never empty (old behaviour).
  const chips = hasConcerns ? concernLabels : display
  const detail = hasConcerns ? display : []

  return (
    <div className="bg-white rounded-2xl border border-skin-100 p-5 mb-4">
      <h2 className="font-display text-xl font-light text-charcoal-900 mb-3">{t('scan_detected_concerns')}</h2>
      <div className="flex flex-wrap gap-2">
        {chips.map((c, i) => (
          <span key={i} className="bg-skin-100 text-skin-700 text-sm px-3 py-1.5 rounded-full font-medium">
            {c}
          </span>
        ))}
      </div>
      {detail.length > 0 && (
        <ul className="space-y-1 mt-3 pt-3 border-t border-skin-50">
          {detail.map((c, i) => (
            <li key={i} className="text-xs text-charcoal-500 font-body flex gap-1.5">
              <span className="text-skin-400 shrink-0">•</span>{c}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
