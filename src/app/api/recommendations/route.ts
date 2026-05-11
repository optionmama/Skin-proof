import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

/**
 * Generates personalised product recommendations for the authenticated user.
 *
 * IMPORTANT: Rankings are determined SOLELY by skin profile match score.
 * Affiliate commission rates are NEVER used in ranking calculations.
 * This is enforced both in this code and in the database schema
 * (ranking_is_commission_free BOOLEAN DEFAULT TRUE NOT NULL).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user skin profile
  const { data: skinProfile } = await supabase
    .from('skin_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!skinProfile) {
    return NextResponse.json(
      { error: 'Complete your skin profile before getting recommendations' },
      { status: 400 }
    )
  }

  // Fetch recent scan data for context
  const { data: recentScans } = await supabase
    .from('skin_photos')
    .select('overall_skin_score, detected_concerns, acne_severity, redness_score, hydration_score')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Fetch products with ingredients — filtered by skin compatibility
  // NOTE: No sorting by commission, no commission field fetched for ranking
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, brand, category, description,
      cruelty_free, vegan, fragrance_free,
      suitable_skin_types,
      product_ingredients(inci_name, comedogenic_rating, ewg_score, known_irritants_for)
    `)
    .eq('is_verified', true)
    .limit(100)

  if (!products || products.length === 0) {
    return NextResponse.json({ recommendations: [] })
  }

  // ============================================================
  // RANKING ALGORITHM — Commission-free by design
  // Scores are based purely on skin profile compatibility.
  // ============================================================
  const scoredProducts = products.map((product) => {
    let score = 0
    const matchReasons: string[] = []

    // 1. Skin type compatibility (+30 points)
    if (
      !product.suitable_skin_types ||
      product.suitable_skin_types.length === 0 ||
      product.suitable_skin_types.includes(skinProfile.skin_type) ||
      product.suitable_skin_types.includes('all')
    ) {
      score += 30
      matchReasons.push(`Suited for ${skinProfile.skin_type} skin`)
    } else {
      score -= 20 // Penalise mismatched skin type
    }

    // 2. Fragrance-free bonus for sensitive skin (+15)
    if (skinProfile.skin_type === 'sensitive' && product.fragrance_free) {
      score += 15
      matchReasons.push('Fragrance-free — gentle for sensitive skin')
    }

    // 3. Check ingredients against user's known allergies (-50 per allergen)
    const allergens = skinProfile.known_allergies || []
    const ingredients = product.product_ingredients || []
    let hasAllergen = false
    for (const allergen of allergens) {
      const found = ingredients.some((ing: { inci_name: string }) =>
        ing.inci_name.toLowerCase().includes(allergen.toLowerCase())
      )
      if (found) {
        score -= 50
        hasAllergen = true
      }
    }
    if (allergens.length > 0 && !hasAllergen) {
      score += 10
      matchReasons.push('Free from your flagged ingredients')
    }

    // 4. Comedogenic rating check for acne-prone skin
    const userConcerns = skinProfile.primary_concerns || []
    if (userConcerns.includes('acne') || userConcerns.includes('breakouts')) {
      const highComedogenic = ingredients.filter(
        (ing: { comedogenic_rating: number }) => ing.comedogenic_rating >= 4
      )
      if (highComedogenic.length === 0) {
        score += 15
        matchReasons.push('Non-comedogenic formula')
      } else {
        score -= highComedogenic.length * 8
      }
    }

    // 5. EWG safety score bonus
    const avgEwg =
      ingredients.length > 0
        ? ingredients.reduce((sum: number, ing: { ewg_score: number | null }) => sum + (ing.ewg_score || 3), 0) / ingredients.length
        : 3
    if (avgEwg <= 2) {
      score += 10
      matchReasons.push('Low EWG hazard score')
    } else if (avgEwg >= 7) {
      score -= 15
    }

    // 6. Concern matching bonus
    const concernCategoryMap: Record<string, string[]> = {
      acne: ['treatment', 'cleanser', 'toner'],
      hyperpigmentation: ['serum', 'treatment', 'sunscreen'],
      dryness: ['moisturiser', 'serum', 'mask'],
      oiliness: ['cleanser', 'toner', 'moisturiser'],
      anti_aging: ['serum', 'moisturiser', 'eye_cream'],
      sensitivity: ['moisturiser', 'cleanser'],
      dark_circles: ['eye_cream', 'serum'],
    }
    for (const concern of userConcerns) {
      const relevantCategories = concernCategoryMap[concern] || []
      if (relevantCategories.includes(product.category)) {
        score += 8
        matchReasons.push(`Targets ${concern.replace(/_/g, ' ')}`)
        break
      }
    }

    // 7. Scan-based adjustments
    if (recentScans && recentScans.length > 0) {
      const avgHydration = recentScans.reduce((s: number, r) => s + (r.hydration_score || 50), 0) / recentScans.length
      if (avgHydration < 40 && ['moisturiser', 'serum', 'mask'].includes(product.category)) {
        score += 8
        matchReasons.push('Helpful for your current hydration levels')
      }
    }

    // Cap score 0–100
    const finalScore = Math.min(100, Math.max(0, score))

    return {
      product_id: product.id,
      ranking_score: finalScore,
      match_reasons: [...new Set(matchReasons)].slice(0, 4),
      ranking_is_commission_free: true, // Always true — enforced in DB schema
    }
  })

  // Sort by score descending — NEVER by commission
  const topProducts = scoredProducts
    .filter((p) => p.ranking_score >= 20)
    .sort((a, b) => b.ranking_score - a.ranking_score)
    .slice(0, 20)

  // Upsert recommendations (delete old, insert new)
  await supabase
    .from('recommendations')
    .delete()
    .eq('user_id', user.id)

  if (topProducts.length > 0) {
    await supabase.from('recommendations').insert(
      topProducts.map((p) => ({
        user_id: user.id,
        product_id: p.product_id,
        ranking_score: p.ranking_score,
        match_reasons: p.match_reasons,
        ranking_is_commission_free: true,
      }))
    )
  }

  return NextResponse.json({
    success: true,
    count: topProducts.length,
    disclaimer:
      'Recommendations are ranked by skin profile compatibility only. Affiliate relationships do not influence ranking.',
  })
}
