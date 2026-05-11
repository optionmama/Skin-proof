import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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

export const DISCLAIMER_TEXT = `⚠️ IMPORTANT DISCLAIMER: SkinProof is a personal skin tracking and product diary tool. 
AI analysis results are for informational and tracking purposes only and do NOT constitute medical diagnosis, 
medical advice, or professional dermatological assessment. Always consult a licensed dermatologist or 
healthcare professional for any skin conditions or medical concerns. Results may vary and should not 
be used to replace professional medical advice.`

export const SHORT_DISCLAIMER = 'Not a medical diagnosis. For tracking purposes only.'
