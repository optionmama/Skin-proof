// Single source of truth for "does this product suit today's skin?".
//
// Previously TWO different implementations existed — the Today's Skin (result)
// page matched keywords against a product's free-text `notes`, while the For You
// page checked the structured `ingredients_to_flag` data — using different
// thresholds. The same product (e.g. SK2 + Methylparaben) could therefore show
// ✅ on one page and ⚠️ on the other on the same day, destroying user trust.
//
// Both pages now call checkProductCompatibility() so the verdict is identical.
// This function is data-only (no i18n); each caller localizes the messages from
// the returned ingredient + kind so the rule itself can never diverge.

export interface FlagIngredients {
  comedogenic?: string[]
  irritating?: string[]
  actives?: string[]
}

export interface CompatibilityIngredients {
  ingredients_to_flag?: FlagIngredients
  concerns_targeted?: string[]
}

export type CompatFlagKind = 'comedogenic' | 'irritating'

export interface CompatFlag {
  ingredient: string
  kind: CompatFlagKind
}

export type CompatibilityResult =
  | { status: 'loading' }
  | { status: 'good'; helpful: boolean; helpfulConcern: string | null }
  | { status: 'warning'; flags: CompatFlag[] }

/**
 * Decide whether a product suits the latest scan.
 *
 * @param ingredients   structured ingredient data (null = not looked up yet → 'loading')
 * @param scanDimensions the latest scan's 0-100 dimension scores
 * @param mainConcern   the latest scan's main concern (for the "good, targets X" message)
 */
export function checkProductCompatibility(
  ingredients: CompatibilityIngredients | null,
  scanDimensions: Record<string, number> | null,
  mainConcern: string | null,
): CompatibilityResult {
  if (!ingredients) return { status: 'loading' }

  const d = scanDimensions || {}
  const flags: CompatFlag[] = []
  const flagSet = ingredients.ingredients_to_flag || {}

  // Comedogenic — flag if oiliness or breakouts are high.
  if ((((d.oiliness ?? 0) > 60) || ((d.breakouts ?? 0) > 50)) && (flagSet.comedogenic?.length ?? 0) > 0) {
    flags.push({ ingredient: flagSet.comedogenic![0], kind: 'comedogenic' })
  }

  // Irritating — flag if redness is high.
  if (((d.redness ?? 0) > 55) && (flagSet.irritating?.length ?? 0) > 0) {
    flags.push({ ingredient: flagSet.irritating![0], kind: 'irritating' })
  }

  if (flags.length > 0) return { status: 'warning', flags }

  const targets = ingredients.concerns_targeted || []
  const concern = (mainConcern || '').toLowerCase()
  const helpful = concern.length > 0 && targets.some(c => {
    const cl = c.toLowerCase()
    return cl.includes(concern) || concern.includes(cl)
  })
  return { status: 'good', helpful, helpfulConcern: helpful ? mainConcern : null }
}
