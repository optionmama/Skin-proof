// Seed catalog for "Recommended to start" — derm guidance + aggregated public reviews.
// NOT real SkinProof user-outcome data. See `IS_SEED_DATA` / community picks for that.

export type SeedAgeGroup = '20s' | '30s' | '40s+'
export type SeedConfidence = 'high' | 'medium' | 'estimated'
export type SeedRisk = 'low' | 'medium' | 'high'
export type SeedCategory =
  | 'cleanser' | 'treatment' | 'serum' | 'exfoliant' | 'sunscreen'
  | 'essence' | 'ampoule' | 'moisturizer' | 'toner' | 'eye'

export interface SeedProduct {
  id: string
  brand: string
  name: string
  category: SeedCategory
  ageGroups: SeedAgeGroup[]
  concerns: string[]
  ingredients: string[]
  priceUsd: number
  irritationRisk: SeedRisk
  timelineDays: number
  confidence: SeedConfidence
  isRx: boolean
}

export const IS_SEED_DATA = true

export const SEED_PRODUCTS: SeedProduct[] = [
  { id: 'cerave-foaming-cleanser', brand: 'CeraVe', name: 'Foaming Facial Cleanser', category: 'cleanser',
    ageGroups: ['20s', '30s'], concerns: ['acne', 'oily skin'], ingredients: ['niacinamide', 'ceramides', 'hyaluronic acid'],
    priceUsd: 15, irritationRisk: 'low', timelineDays: 14, confidence: 'high', isRx: false },
  { id: 'differin-adapalene-0.1', brand: 'Differin', name: 'Adapalene Gel 0.1% Acne Treatment', category: 'treatment',
    ageGroups: ['20s'], concerns: ['acne', 'clogged pores', 'texture'], ingredients: ['adapalene (retinoid)'],
    priceUsd: 15, irritationRisk: 'medium', timelineDays: 84, confidence: 'high', isRx: false },
  { id: 'ordinary-niacinamide-zinc', brand: 'The Ordinary', name: 'Niacinamide 10% + Zinc 1%', category: 'serum',
    ageGroups: ['20s', '30s'], concerns: ['acne', 'oily skin', 'enlarged pores'], ingredients: ['niacinamide', 'zinc'],
    priceUsd: 6, irritationRisk: 'low', timelineDays: 56, confidence: 'high', isRx: false },
  { id: 'paulas-choice-2bha', brand: "Paula's Choice", name: 'Skin Perfecting 2% BHA Liquid Exfoliant', category: 'exfoliant',
    ageGroups: ['20s', '30s'], concerns: ['blackheads', 'clogged pores', 'texture', 'acne'], ingredients: ['salicylic acid (BHA)'],
    priceUsd: 35, irritationRisk: 'medium', timelineDays: 42, confidence: 'high', isRx: false },
  { id: 'lrp-effaclar-duo', brand: 'La Roche-Posay', name: 'Effaclar Duo Acne Treatment', category: 'treatment',
    ageGroups: ['20s'], concerns: ['acne', 'blemishes'], ingredients: ['benzoyl peroxide', 'niacinamide'],
    priceUsd: 30, irritationRisk: 'medium', timelineDays: 42, confidence: 'high', isRx: false },
  { id: 'eltamd-uv-clear-46', brand: 'EltaMD', name: 'UV Clear Broad-Spectrum SPF 46', category: 'sunscreen',
    ageGroups: ['20s', '30s', '40s+'], concerns: ['sun protection', 'acne-prone', 'redness'], ingredients: ['zinc oxide', 'niacinamide'],
    priceUsd: 41, irritationRisk: 'low', timelineDays: 0, confidence: 'high', isRx: false },
  { id: 'cosrx-snail-96', brand: 'COSRX', name: 'Advanced Snail 96 Mucin Power Essence', category: 'essence',
    ageGroups: ['20s', '30s'], concerns: ['hydration', 'glass skin', 'barrier repair', 'dullness'], ingredients: ['snail secretion filtrate'],
    priceUsd: 25, irritationRisk: 'low', timelineDays: 14, confidence: 'high', isRx: false },
  { id: 'boj-glow-serum', brand: 'Beauty of Joseon', name: 'Glow Deep Serum: Rice + Alpha Arbutin', category: 'serum',
    ageGroups: ['20s', '30s'], concerns: ['dullness', 'glass skin', 'brightening', 'uneven tone'], ingredients: ['rice extract', 'alpha arbutin', 'niacinamide'],
    priceUsd: 17, irritationRisk: 'low', timelineDays: 42, confidence: 'high', isRx: false },
  { id: 'boj-relief-sun', brand: 'Beauty of Joseon', name: 'Relief Sun: Rice + Probiotics SPF50+ PA++++', category: 'sunscreen',
    ageGroups: ['20s', '30s', '40s+'], concerns: ['sun protection', 'prevention'], ingredients: ['rice extract', 'probiotics', 'niacinamide'],
    priceUsd: 18, irritationRisk: 'low', timelineDays: 0, confidence: 'high', isRx: false },
  { id: 'skin1004-centella-ampoule', brand: 'SKIN1004', name: 'Madagascar Centella Ampoule', category: 'ampoule',
    ageGroups: ['20s', '30s'], concerns: ['redness', 'sensitivity', 'barrier repair'], ingredients: ['centella asiatica'],
    priceUsd: 20, irritationRisk: 'low', timelineDays: 21, confidence: 'high', isRx: false },
  { id: 'anua-heartleaf-toner', brand: 'Anua', name: 'Heartleaf 77% Soothing Toner', category: 'toner',
    ageGroups: ['20s', '30s'], concerns: ['redness', 'oil balance', 'soothing'], ingredients: ['heartleaf (houttuynia cordata)'],
    priceUsd: 20, irritationRisk: 'low', timelineDays: 21, confidence: 'medium', isRx: false },
  { id: 'cerave-retinol-serum', brand: 'CeraVe', name: 'Resurfacing Retinol Serum', category: 'serum',
    ageGroups: ['30s', '40s+'], concerns: ['fine lines', 'texture', 'post-acne marks'], ingredients: ['encapsulated retinol', 'niacinamide', 'ceramides'],
    priceUsd: 20, irritationRisk: 'medium', timelineDays: 84, confidence: 'high', isRx: false },
  { id: 'ordinary-buffet-peptide', brand: 'The Ordinary', name: 'Buffet Multi-Technology Peptide Serum', category: 'serum',
    ageGroups: ['30s', '40s+'], concerns: ['fine lines', 'firmness', 'anti-aging'], ingredients: ['matrixyl 3000', 'argireline', 'leuphasyl', 'GABA', 'hyaluronic acid'],
    priceUsd: 15, irritationRisk: 'low', timelineDays: 84, confidence: 'high', isRx: false },
  { id: 'clinique-moisture-surge-100h', brand: 'Clinique', name: 'Moisture Surge 100H Auto-Replenishing Hydrator', category: 'moisturizer',
    ageGroups: ['20s', '30s'], concerns: ['hydration', 'oily skin', 'combination skin'], ingredients: ['hyaluronic acid', 'aloe bioferment', 'caffeine'],
    priceUsd: 42, irritationRisk: 'low', timelineDays: 7, confidence: 'high', isRx: false },
  { id: 'laneige-cream-skin-toner', brand: 'Laneige', name: 'Cream Skin Toner & Moisturizer', category: 'toner',
    ageGroups: ['20s', '30s'], concerns: ['hydration', 'barrier repair', 'dryness'], ingredients: ['white tea leaf water', 'milk protein extract'],
    priceUsd: 30, irritationRisk: 'low', timelineDays: 14, confidence: 'high', isRx: false },
  { id: 'tretinoin-rx', brand: 'Prescription', name: 'Tretinoin (Rx retinoid)', category: 'treatment',
    ageGroups: ['30s', '40s+'], concerns: ['wrinkles', 'photoaging', 'texture', 'acne'], ingredients: ['tretinoin'],
    priceUsd: 25, irritationRisk: 'high', timelineDays: 84, confidence: 'high', isRx: true },
  { id: 'roc-retinol-correxion', brand: 'RoC', name: 'Retinol Correxion Line Smoothing Serum', category: 'serum',
    ageGroups: ['40s+'], concerns: ['wrinkles', 'firmness', 'texture'], ingredients: ['retinol', 'mineral complex'],
    priceUsd: 25, irritationRisk: 'medium', timelineDays: 84, confidence: 'high', isRx: false },
  { id: 'medipeel-peptide9', brand: 'MEDI-PEEL', name: 'Peptide 9 Volume Lifting Ampoule', category: 'ampoule',
    ageGroups: ['40s+'], concerns: ['wrinkles', 'sagging', 'mature skin'], ingredients: ['9 peptide complex', 'EGF', 'hyaluronic acid'],
    priceUsd: 28, irritationRisk: 'low', timelineDays: 84, confidence: 'medium', isRx: false },
  { id: 'skinceuticals-ce-ferulic', brand: 'SkinCeuticals', name: 'C E Ferulic', category: 'serum',
    ageGroups: ['30s', '40s+'], concerns: ['antioxidant', 'firmness', 'photoaging', 'brightening'], ingredients: ['vitamin C (l-ascorbic acid)', 'vitamin E', 'ferulic acid'],
    priceUsd: 182, irritationRisk: 'medium', timelineDays: 84, confidence: 'high', isRx: false },
  { id: 'purito-barrier-cream', brand: 'PURITO', name: 'Oat-In Calming Gel Cream', category: 'moisturizer',
    ageGroups: ['30s', '40s+'], concerns: ['dryness', 'barrier repair', 'sensitivity'], ingredients: ['oat extract', 'panthenol', 'ceramides'],
    priceUsd: 18, irritationRisk: 'low', timelineDays: 14, confidence: 'medium', isRx: false },
  { id: 'medipeel-peptide-eye-patch', brand: 'MEDI-PEEL', name: 'Peptide 9 Volume Eye Patch', category: 'eye',
    ageGroups: ['40s+'], concerns: ["crow's feet", 'under-eye fine lines', 'puffiness'], ingredients: ['9 peptide complex', 'EGF', 'hydrogel'],
    priceUsd: 22, irritationRisk: 'low', timelineDays: 28, confidence: 'medium', isRx: false },
  { id: 'cerave-moisturizing-cream', brand: 'CeraVe', name: 'Moisturizing Cream', category: 'moisturizer',
    ageGroups: ['20s', '30s', '40s+'], concerns: ['dryness', 'barrier repair'], ingredients: ['ceramides', 'hyaluronic acid'],
    priceUsd: 16, irritationRisk: 'low', timelineDays: 7, confidence: 'high', isRx: false },
  { id: 'anua-azelaic-10', brand: 'Anua', name: 'Azelaic Acid 10% Redness Soothing Serum', category: 'serum',
    ageGroups: ['20s', '30s', '40s+'], concerns: ['redness', 'acne', 'texture', 'uneven tone'], ingredients: ['azelaic acid', 'niacinamide', 'hyaluronic acid'],
    priceUsd: 25, irritationRisk: 'low', timelineDays: 56, confidence: 'medium', isRx: false },
  { id: 'vitc-budget-boj', brand: 'Beauty of Joseon', name: 'Glow Serum (budget vitamin C alternative)', category: 'serum',
    ageGroups: ['20s', '30s', '40s+'], concerns: ['brightening', 'antioxidant', 'dullness'], ingredients: ['vitamin C derivative', 'niacinamide'],
    priceUsd: 17, irritationRisk: 'low', timelineDays: 56, confidence: 'medium', isRx: false },
  { id: 'lrp-anthelios-spf', brand: 'La Roche-Posay', name: 'Anthelios Sunscreen SPF 50+', category: 'sunscreen',
    ageGroups: ['30s', '40s+'], concerns: ['sun protection', 'photoaging prevention'], ingredients: ['broad-spectrum filters'],
    priceUsd: 35, irritationRisk: 'low', timelineDays: 0, confidence: 'high', isRx: false },
  { id: 'ordinary-vitc-suspension', brand: 'The Ordinary', name: 'Vitamin C Suspension / Ascorbyl Glucoside', category: 'serum',
    ageGroups: ['20s', '30s'], concerns: ['dark spots', 'brightening', 'prevention'], ingredients: ['vitamin C'],
    priceUsd: 12, irritationRisk: 'medium', timelineDays: 56, confidence: 'medium', isRx: false },
  { id: 'cosrx-bha-blackhead', brand: 'COSRX', name: 'BHA Blackhead Power Liquid', category: 'exfoliant',
    ageGroups: ['20s', '30s'], concerns: ['blackheads', 'clogged pores', 'bumpy texture'], ingredients: ['betaine salicylate (BHA)'],
    priceUsd: 22, irritationRisk: 'medium', timelineDays: 42, confidence: 'medium', isRx: false },
  { id: 'hada-labo-ha-lotion', brand: 'Hada Labo', name: 'Gokujyun Hyaluronic Acid Lotion', category: 'toner',
    ageGroups: ['20s', '30s', '40s+'], concerns: ['hydration', 'plumping'], ingredients: ['multiple hyaluronic acids'],
    priceUsd: 15, irritationRisk: 'low', timelineDays: 7, confidence: 'medium', isRx: false },
  { id: 'boj-dynasty-cream', brand: 'Beauty of Joseon', name: 'Dynasty Cream', category: 'moisturizer',
    ageGroups: ['30s', '40s+'], concerns: ['firmness', 'barrier repair', 'nourishment'], ingredients: ['niacinamide', 'ceramides', 'hyaluronic acid', 'ginseng'],
    priceUsd: 20, irritationRisk: 'low', timelineDays: 21, confidence: 'medium', isRx: false },
]

/** Maps SKIN_CONCERNS (canonical onboarding/scan vocabulary) to seed-catalog concern tags. */
const CONCERN_SYNONYMS: Record<string, string[]> = {
  acne: ['acne', 'blemishes', 'clogged pores', 'stubborn acne'],
  hyperpigmentation: ['dark spots', 'uneven tone', 'brightening', 'dullness'],
  wrinkles: ['wrinkles', 'fine lines', 'firmness', 'sagging', 'mature skin', 'photoaging', "crow's feet", 'under-eye fine lines'],
  dryness: ['dryness', 'hydration', 'barrier repair', 'plumping', 'nourishment'],
  oiliness: ['oily skin', 'oil balance', 'enlarged pores'],
  redness: ['redness', 'sensitivity', 'soothing'],
  pores: ['enlarged pores', 'clogged pores', 'blackheads', 'bumpy texture'],
  dark_circles: ['under-eye fine lines', 'puffiness', "crow's feet"],
  texture: ['texture', 'bumpy texture', 'gentle exfoliation'],
  sensitivity: ['sensitivity', 'redness', 'barrier repair', 'soothing'],
  dullness: ['dullness', 'glass skin', 'brightening', 'antioxidant'],
  blackheads: ['blackheads', 'clogged pores', 'bumpy texture'],
}

const CONFIDENCE_WEIGHT: Record<SeedConfidence, number> = { high: 2, medium: 1, estimated: 0 }

export interface SeedMatchInput {
  ageGroup: SeedAgeGroup | null
  /** Canonical concern keys, e.g. from SKIN_CONCERNS or a scan's main_concern. */
  concerns: string[]
}

/**
 * Ranks the seed catalog for a user. Falls back to broadly-trusted, affordable
 * picks (by confidence + price) when there's no age/concern signal yet, so new
 * users without a scan still get a sensible starter set.
 */
export function matchSeedProducts(input: SeedMatchInput, limit = 4): SeedProduct[] {
  const tags = new Set<string>()
  for (const c of input.concerns) {
    for (const syn of CONCERN_SYNONYMS[c] || [c]) tags.add(syn.toLowerCase())
  }

  return SEED_PRODUCTS
    .map(product => {
      let score = CONFIDENCE_WEIGHT[product.confidence] - product.priceUsd * 0.02
      const productConcerns = product.concerns.map(c => c.toLowerCase())
      for (const tag of tags) {
        if (productConcerns.some(pc => pc.includes(tag) || tag.includes(pc))) score += 10
      }
      if (input.ageGroup && product.ageGroups.includes(input.ageGroup)) score += 5
      if (product.category === 'sunscreen') score += 3
      return { product, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => product)
}

/**
 * Returns the canonical concern (from `concerns`) that best explains why this
 * product was recommended, for display in the product detail view.
 */
export function matchedConcern(product: SeedProduct, concerns: string[]): string | null {
  const productConcerns = product.concerns.map(c => c.toLowerCase())
  for (const concern of concerns) {
    const syns = (CONCERN_SYNONYMS[concern] || [concern]).map(s => s.toLowerCase())
    if (productConcerns.some(pc => syns.some(s => pc.includes(s) || s.includes(pc)))) {
      return concern
    }
  }
  return null
}
