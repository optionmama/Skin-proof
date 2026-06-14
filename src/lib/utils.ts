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
  return `${domain}?q=${encodeURIComponent(`${brand} ${name}`)}&tbm=shop`
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
  return concern
}

