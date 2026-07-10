import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SeedAgeGroup } from './seed-products'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatShortDate(date: string | Date): string {
  // A bare YYYY-MM-DD (checkin_date) is a LOCAL day key (2026-07-10 fix: all
  // day keys are now the user's local day, not UTC — see src/lib/day.ts).
  // Parse it as LOCAL midnight so it renders as that same calendar day;
  // parsing it raw would treat it as UTC midnight and shift the label a day
  // back on devices west of UTC.
  const d = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(date + 'T00:00:00')
    : new Date(date)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function scoreToLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-sage-600' }
  if (score >= 65) return { label: 'Good', color: 'text-sage-500' }
  if (score >= 50) return { label: 'Fair', color: 'text-cream-500' }
  if (score >= 35) return { label: 'Poor', color: 'text-skin-500' }
  return { label: 'Critical', color: 'text-red-600' }
}

export function skinConcernLabel(concern: string): string {
  const labels: Record<string, string> = {
    acne: 'Acne',
    hyperpigmentation: 'Hyperpigmentation',
    wrinkles: 'Fine Lines & Wrinkles',
    dryness: 'Dryness',
    oiliness: 'Oiliness',
    redness: 'Redness',
    pores: 'Enlarged Pores',
    dark_circles: 'Dark Circles',
    texture: 'Texture',
    sensitivity: 'Sensitivity',
    dullness: 'Dullness',
    blackheads: 'Blackheads & Whiteheads',
  }
  return labels[concern] || concern
}

export const SKIN_CONCERNS = [
  'acne', 'hyperpigmentation', 'wrinkles', 'dryness', 'oiliness',
  'redness', 'pores', 'dark_circles', 'texture', 'sensitivity', 'dullness', 'blackheads'
]

export const GOOGLE_DOMAINS: Record<string, string> = {
  Asia: 'https://www.google.com.tw/search',
  Americas: 'https://www.google.com/search',
  Europe: 'https://www.google.co.uk/search',
  Australia: 'https://www.google.com.au/search',
  Global: 'https://www.google.com/search',
}

export function getGoogleShoppingUrl(brand: string, name: string, region = 'Global'): string {
  const domain = GOOGLE_DOMAINS[region] || GOOGLE_DOMAINS['Global']
  // Use a regular Google search with an exact-phrase query (quotes) rather than
  // the Shopping tab (&tbm=shop). The Shopping tab ignores quotes and returns a
  // loose mix of the brand's other products — so users couldn't tell which item
  // was actually recommended. A plain search honours the quoted phrase and lands
  // on the specific product (with shopping listings shown inline).
  const query = `${brand} ${name}`.trim()
  return `${domain}?q=${encodeURIComponent(`"${query}"`)}`
}

export function getRegionFromTimezone(tz: string): string {
  if (tz.startsWith('Asia/')) return 'Asia'
  if (tz.startsWith('America/')) return 'Americas'
  if (tz.startsWith('Europe/')) return 'Europe'
  if (tz.startsWith('Australia/') || tz.startsWith('Pacific/Auckland')) return 'Australia'
  return 'Global'
}

/** Maps onboarding's skin_profiles.age_range (e.g. "31–35") to the seed catalog's age buckets. */
export function ageRangeToGroup(ageRange: string | null | undefined): SeedAgeGroup | null {
  switch (ageRange) {
    case 'Under 20':
    case '20–25':
    case '26–30':
      return '20s'
    case '31–35':
    case '36–40':
      return '30s'
    case '41–45':
    case '46+':
      return '40s+'
    default:
      return null
  }
}

/** Maps a scan's ai_analysis_raw.main_concern to the canonical SKIN_CONCERNS vocabulary. */
export function mainConcernToSkinConcern(concern: string | null | undefined): string | null {
  if (!concern || concern === 'none') return null
  if (concern === 'breakouts') return 'acne'
  if (concern === 'pores') return 'pores'
  return concern
}

/** Shape of the relevant parts of a scan's `ai_analysis_raw`. */
export interface ScanAnalysis {
  main_concern?: string | null
  visible_observations?: string[] | null
  dimensions?: Record<string, number> | null
}

// Keyword → canonical concern rules for free-text observations. Bilingual
// (English + zh-TW/zh-CN) because observations are generated in the user's
// language; without the Chinese terms, Chinese scans matched nothing and the
// concern tags fell out of sync with the AI's written detail. Order doesn't
// matter; every matching rule contributes its concern. NOTE: 粉刺/黑頭/閉口
// (comedones) map to 'blackheads', NOT 'acne' — keep 痘/痤瘡 out of blackheads
// and 粉刺 out of acne so the two stay distinct.
const OBSERVATION_CONCERN_RULES: { re: RegExp; concern: string }[] = [
  { re: /blackhead|whitehead|comedone|粉刺|粉剌|黑頭|黑头|白頭|白头|閉口|闭口/i,          concern: 'blackheads' },
  { re: /pore|clogg|congest|毛孔|粗大/i,                                              concern: 'pores' },
  { re: /pimple|acne|breakout|blemish|\bspot\b|zit|pustule|papule|痘|痤瘡|痤疮|面皰|面疱|膿皰|脓疱|丘疹/i, concern: 'acne' },
  { re: /textur|bumpy|rough|uneven|grainy|patchy|紋理|纹理|粗糙|不平|顆粒|颗粒|凹凸/i,      concern: 'texture' },
  { re: /oil|shine|shiny|sebum|greasy|t-?zone|出油|油光|泛油|油膩|油腻|T字/i,             concern: 'oiliness' },
  { re: /dry|flak|dehydrat|tight|\bpatch|乾燥|干燥|脫皮|脱皮|脫屑|脱屑|缺水|緊繃|紧绷/i,     concern: 'dryness' },
  { re: /red(?!uc)|irritat|inflam|rosace|blotch|泛紅|泛红|發紅|发红|紅腫|红肿|血絲|血丝/i,   concern: 'redness' },
  { re: /sensitiv|敏感|刺激/i,                                                        concern: 'sensitivity' },
  { re: /dark spot|hyperpigment|pigment|sun damage|melasma|\bmark|色素|色斑|曬斑|晒斑|黑斑|痘印|色沉|斑點|斑点/i, concern: 'hyperpigmentation' },
  { re: /wrinkle|fine line|aging|ageing|sagg|firm|elasticity|細紋|细纹|皺紋|皱纹|老化|紋路|纹路|法令/i, concern: 'wrinkles' },
  { re: /dark circle|under-?eye|黑眼圈|眼周|眼袋/i,                                     concern: 'dark_circles' },
  { re: /dull|tired|lacklustre|lackluster|暗沉|暗沈|蠟黃|蜡黄|無光澤|无光泽|氣色|气色/i,     concern: 'dullness' },
]

/**
 * Derives the canonical concern set from a user's LATEST scan so that "For You"
 * recommendations track real, scan-specific findings (and change scan to scan)
 * rather than the static onboarding profile.
 *
 * Primary signal is the structured `dimensions` (0–100; semantics fixed by the
 * analyze-skin prompt: higher redness/breakouts/oiliness/pores = worse, lower
 * hydration/evenness = worse). Free-text `visible_observations` and the single
 * `main_concern` are folded in as supplements.
 */
export function deriveScanConcerns(scan: ScanAnalysis | null | undefined): string[] {
  if (!scan) return []

  // PRIMARY: the AI's free-text observations. These are what the scan page shows
  // as the human-readable detail, so the concern tags (and the For You groups,
  // which call this same fn) must SUMMARISE them — the tags are the headline of
  // the detail. Deriving from the notes keeps top and bottom in lock-step and
  // avoids the "scored acne high but wrote about fine lines" mismatch surfacing
  // as a tag the detail never mentions.
  const fromObs = new Set<string>()
  for (const obs of scan.visible_observations || []) {
    if (typeof obs !== 'string') continue
    for (const rule of OBSERVATION_CONCERN_RULES) {
      if (rule.re.test(obs)) fromObs.add(rule.concern)
    }
  }
  if (fromObs.size > 0) return Array.from(fromObs)

  // FALLBACK: notes yielded nothing usable (vague/empty text) → fall back to the
  // structured scores + main_concern so the concern set is never empty.
  const found = new Set<string>()
  const mc = mainConcernToSkinConcern(scan.main_concern)
  if (mc) found.add(mc)
  const d = scan.dimensions || {}
  const num = (k: string) => (typeof d[k] === 'number' ? d[k] : null)
  const redness = num('redness'); if (redness !== null && redness >= 50) found.add('redness')
  const breakouts = num('breakouts'); if (breakouts !== null && breakouts >= 40) found.add('acne')
  const hydration = num('hydration'); if (hydration !== null && hydration <= 55) found.add('dryness')
  const oiliness = num('oiliness'); if (oiliness !== null && oiliness >= 55) found.add('oiliness')
  const pores = num('pores'); if (pores !== null && pores >= 50) found.add('pores')
  const evenness = num('evenness'); if (evenness !== null && evenness <= 55) found.add('texture')
  return Array.from(found)
}

