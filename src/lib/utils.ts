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
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
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
    blackheads: 'Blackheads',
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

// Keyword → canonical concern rules for free-text observations. Order doesn't
// matter; every matching rule contributes its concern.
const OBSERVATION_CONCERN_RULES: { re: RegExp; concern: string }[] = [
  { re: /blackhead|whitehead|comedone/i,                         concern: 'blackheads' },
  { re: /pore|clogg|congest/i,                                   concern: 'pores' },
  { re: /pimple|acne|breakout|blemish|\bspot\b|zit|pustule|papule/i, concern: 'acne' },
  { re: /textur|bumpy|rough|uneven|grainy|patchy/i,              concern: 'texture' },
  { re: /oil|shine|shiny|sebum|greasy|t-?zone/i,                 concern: 'oiliness' },
  { re: /dry|flak|dehydrat|tight|\bpatch/i,                      concern: 'dryness' },
  { re: /red(?!uc)|irritat|inflam|rosace|blotch/i,               concern: 'redness' },
  { re: /sensitiv/i,                                             concern: 'sensitivity' },
  { re: /dark spot|hyperpigment|pigment|sun damage|melasma|\bmark/i, concern: 'hyperpigmentation' },
  { re: /wrinkle|fine line|aging|ageing|sagg|firm|elasticity/i,  concern: 'wrinkles' },
  { re: /dark circle|under-?eye/i,                               concern: 'dark_circles' },
  { re: /dull|tired|lacklustre|lackluster/i,                     concern: 'dullness' },
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

  for (const obs of scan.visible_observations || []) {
    if (typeof obs !== 'string') continue
    for (const rule of OBSERVATION_CONCERN_RULES) {
      if (rule.re.test(obs)) found.add(rule.concern)
    }
  }

  return Array.from(found)
}

