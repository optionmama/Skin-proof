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
  pores: ['enlarged pores', 'clogged pores', 'blackheads'],
  dark_circles: ['under-eye fine lines', 'puffiness', "crow's feet"],
  texture: ['texture', 'bumpy texture', 'gentle exfoliation'],
  sensitivity: ['sensitivity', 'redness', 'barrier repair', 'soothing'],
  dullness: ['dullness', 'glass skin', 'brightening', 'antioxidant'],
  // Note: 'bumpy texture' intentionally excluded here — it cross-matched any
  // 'texture'-tagged product (e.g. retinoids) and mislabelled them as blackheads.
  blackheads: ['blackheads', 'clogged pores'],
}

const CONFIDENCE_WEIGHT: Record<SeedConfidence, number> = { high: 2, medium: 1, estimated: 0 }

export interface SeedMatchInput {
  ageGroup: SeedAgeGroup | null
  /** Canonical concern keys, e.g. from SKIN_CONCERNS or a scan's main_concern. */
  concerns: string[]
}

/** A recommended product plus the specific user-concern it was chosen to address. */
export interface SeedRecommendation {
  product: SeedProduct
  /** Canonical concern key this product addresses for THIS user, or null. */
  reasonConcern: string | null
}

/**
 * True when `product` genuinely addresses canonical `concern`. Matches the
 * concern's synonyms against the product's own concern tags with word-boundary
 * awareness, so e.g. a 'texture' product no longer matches 'blackheads'.
 */
export function productAddressesConcern(product: SeedProduct, concern: string): boolean {
  const syns = (CONCERN_SYNONYMS[concern] || [concern]).map(s => s.toLowerCase())
  const productConcerns = product.concerns.map(c => c.toLowerCase())
  return productConcerns.some(pc =>
    syns.some(s => s === pc || pc.split(' ').includes(s) || s.split(' ').includes(pc))
  )
}

function baseScore(product: SeedProduct, input: SeedMatchInput): number {
  // Quality/value proxy for the PRD's ingredient-match / outcome / price-value /
  // irritation weighting: trusted + affordable + age-appropriate products rank
  // higher, with a small penalty for irritation risk.
  let score = CONFIDENCE_WEIGHT[product.confidence] * 5 - product.priceUsd * 0.02
  for (const c of input.concerns) {
    if (productAddressesConcern(product, c)) score += 10
  }
  if (input.ageGroup && product.ageGroups.includes(input.ageGroup)) score += 5
  if (product.irritationRisk === 'high') score -= 3
  return score
}

/**
 * Diversity-aware recommendation. When the user has multiple concerns, this
 * spreads the picks ACROSS those concerns (one strong product per concern, in
 * the concern priority order given) instead of returning several products that
 * all serve the same single concern/ingredient class. Each pick carries the
 * specific concern it was selected to address, for an accurate per-card "why".
 *
 * Falls back to top quality/value picks when there's no concern signal yet.
 */
export function recommendSeedProducts(input: SeedMatchInput, limit = 4): SeedRecommendation[] {
  const scored = SEED_PRODUCTS
    // v1 compliance: OTC only — prescription items are never recommended (they
    // remain in the catalog as data but are excluded from the For You engine to
    // avoid presenting medical/treatment guidance to the user).
    .filter(product => !product.isRx)
    .map(product => ({ product, score: baseScore(product, input) }))
    .sort((a, b) => b.score - a.score)

  // No concern signal → a well-rounded STARTER SET spread across categories
  // (so we don't show e.g. three sunscreens). Pick the best product per
  // category first, then fill any remaining slots by score.
  if (input.concerns.length === 0) {
    const picked: SeedRecommendation[] = []
    const usedIds = new Set<string>()
    const usedCategories = new Set<string>()
    for (const s of scored) {
      if (picked.length >= limit) break
      if (usedCategories.has(s.product.category)) continue
      picked.push({ product: s.product, reasonConcern: null })
      usedIds.add(s.product.id)
      usedCategories.add(s.product.category)
    }
    for (const s of scored) {
      if (picked.length >= limit) break
      if (usedIds.has(s.product.id)) continue
      picked.push({ product: s.product, reasonConcern: null })
      usedIds.add(s.product.id)
    }
    return picked.slice(0, limit)
  }

  const picked: SeedRecommendation[] = []
  const usedIds = new Set<string>()
  const coveredConcerns = new Set<string>()

  // Greedy pass 1: cover each concern (in priority order) with its best product.
  for (const concern of input.concerns) {
    if (picked.length >= limit) break
    if (coveredConcerns.has(concern)) continue
    const best = scored.find(s => !usedIds.has(s.product.id) && productAddressesConcern(s.product, concern))
    if (best) {
      picked.push({ product: best.product, reasonConcern: concern })
      usedIds.add(best.product.id)
      coveredConcerns.add(concern)
    }
  }

  // Pass 2: fill any remaining slots with the next best products overall, each
  // tagged with the highest-priority concern it still addresses.
  for (const s of scored) {
    if (picked.length >= limit) break
    if (usedIds.has(s.product.id)) continue
    const reason = input.concerns.find(c => productAddressesConcern(s.product, c)) ?? null
    picked.push({ product: s.product, reasonConcern: reason })
    usedIds.add(s.product.id)
  }

  return picked.slice(0, limit)
}

/**
 * Backward-compatible: ranks the seed catalog and returns just the products,
 * now with cross-concern diversity (see `recommendSeedProducts`).
 */
export function matchSeedProducts(input: SeedMatchInput, limit = 4): SeedProduct[] {
  return recommendSeedProducts(input, limit).map(r => r.product)
}

/**
 * Returns the canonical concern (from `concerns`, in priority order) that this
 * specific product actually addresses — for the per-card "why" text. Uses the
 * precise word-aware matcher so labels reflect the real matched concern.
 */
export function matchedConcern(product: SeedProduct, concerns: string[]): string | null {
  for (const concern of concerns) {
    if (productAddressesConcern(product, concern)) return concern
  }
  return null
}
