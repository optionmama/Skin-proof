/**
 * Localized DISPLAY names for flagged ingredients.
 *
 * Compatibility flags carry the raw INCI name from the product's ingredient
 * list (e.g. "Parfum/Fragrance", "Alcohol Denat.", "Methylparaben"). INCI is
 * what's printed on the bottle, but it reads like a typo to users ("Parfum?
 * 那是什麼?"), so for display we map the common flagged families to a friendly
 * localized label and keep the INCI in parentheses. Unknown names fall back to
 * the raw string unchanged.
 *
 * DISPLAY-ONLY: the shared compatibility CHECK in src/lib/compatibility.ts is
 * untouched (R13 — one shared check, never fork the logic).
 */

const RULES: { re: RegExp; zhTW: string; zhCN: string; en: string }[] = [
  { re: /parfum|fragrance/i,
    zhTW: '香精 (Parfum)', zhCN: '香精 (Parfum)', en: 'Fragrance (Parfum)' },
  { re: /alcohol\s*denat|denatured alcohol|\bethanol\b|\balcohol\b/i,
    zhTW: '酒精 (Alcohol)', zhCN: '酒精 (Alcohol)', en: 'Drying alcohol (Alcohol Denat.)' },
  { re: /paraben/i,
    zhTW: '防腐劑 (Paraben)', zhCN: '防腐剂 (Paraben)', en: 'Paraben preservative' },
  { re: /essential oil|\blinalool\b|\blimonene\b|citronellol|geraniol/i,
    zhTW: '精油／香料成分 (Essential oil)', zhCN: '精油／香料成分 (Essential oil)', en: 'Essential-oil fragrance compound' },
  { re: /menthol|peppermint/i,
    zhTW: '薄荷醇 (Menthol)', zhCN: '薄荷醇 (Menthol)', en: 'Menthol' },
  { re: /coconut oil|cocos nucifera/i,
    zhTW: '椰子油 (Coconut oil)', zhCN: '椰子油 (Coconut oil)', en: 'Coconut oil' },
  { re: /isopropyl myristate/i,
    zhTW: '致粉刺酯類 (Isopropyl Myristate)', zhCN: '致粉刺酯类 (Isopropyl Myristate)', en: 'Isopropyl Myristate' },
  { re: /sodium lauryl sulfate|\bsls\b/i,
    zhTW: '硫酸鹽清潔劑 (SLS)', zhCN: '硫酸盐清洁剂 (SLS)', en: 'Sulfate surfactant (SLS)' },
  { re: /lanolin/i,
    zhTW: '羊毛脂 (Lanolin)', zhCN: '羊毛脂 (Lanolin)', en: 'Lanolin' },
]

/** Friendly, localized label for a flagged ingredient (falls back to the raw name). */
export function flagIngredientLabel(raw: string, lang: string): string {
  if (!raw) return raw
  for (const r of RULES) {
    if (r.re.test(raw)) {
      if (lang === 'zh-TW') return r.zhTW
      if (lang === 'zh-CN') return r.zhCN
      return r.en
    }
  }
  return raw
}
