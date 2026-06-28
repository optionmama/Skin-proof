import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai'

export const maxDuration = 60

interface IngredientsData {
  product_found: boolean
  full_name: string
  category: string
  key_ingredients: string[]
  all_notable_ingredients: string[]
  skin_type_suitable: string[]
  concerns_targeted: string[]
  ingredients_to_flag: {
    comedogenic: string[]
    irritating: string[]
    actives: string[]
  }
}

// Normalize a brand/name for fuzzy matching: lowercase, drop everything that
// isn't a letter or digit. So "Sk2 Sk2", "SK-II", "sk 2" all collapse to "sk2"/"skii".
function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Local database of well-known products so famous items resolve INSTANTLY and
// reliably — no slow/failable AI round-trip. Ingredients here are publicly
// documented. Matched by fuzzy substring on the normalized brand+name.
const KNOWN_PRODUCTS: { match: string[]; data: IngredientsData }[] = [
  {
    match: ['sk2', 'skii', 'pitera', 'facialtreatmentessence'],
    data: {
      product_found: true,
      full_name: 'SK-II Facial Treatment Essence',
      category: 'other',
      key_ingredients: ['Galactomyces Ferment Filtrate (Pitera)', 'Niacinamide', 'Pentaerythrityl Tetra-Di-T-Butyl Hydroxyhydrocinnamate'],
      all_notable_ingredients: ['Galactomyces Ferment Filtrate', 'Butylene Glycol', 'Pentaerythrityl Tetra-Di-T-Butyl Hydroxyhydrocinnamate', 'Sodium Benzoate', 'Methylparaben', 'Sorbic Acid'],
      skin_type_suitable: ['all', 'dry', 'combination', 'sensitive'],
      concerns_targeted: ['hydration', 'brightening', 'anti-aging'],
      ingredients_to_flag: { comedogenic: [], irritating: ['Methylparaben'], actives: ['Niacinamide'] },
    },
  },
]

function lookupKnown(brand: string, productName: string): IngredientsData | null {
  const norm = normalizeName(`${brand} ${productName}`)
  if (!norm) return null
  for (const kp of KNOWN_PRODUCTS) {
    if (kp.match.some(m => norm.includes(normalizeName(m)))) return kp.data
  }
  return null
}

async function lookupIngredients(brand: string, productName: string): Promise<IngredientsData | null> {
  const prompt = `You are a skincare ingredient database.
Look up the ingredients for this product and return the key active ingredients.

Product: ${brand} ${productName}

Return ONLY valid JSON, no other text:
{
  "product_found": true | false,
  "full_name": "exact product name as commonly known",
  "category": "toner | serum | moisturiser | cleanser | eye cream | ampoule | other",
  "key_ingredients": ["ingredient1", "ingredient2", "ingredient3"],
  "all_notable_ingredients": ["full list of notable ingredients"],
  "skin_type_suitable": ["oily", "dry", "combination", "sensitive", "all"],
  "concerns_targeted": ["hydration", "brightening", "anti-aging", "acne", "pores", "redness"],
  "ingredients_to_flag": {
    "comedogenic": ["any comedogenic ingredients present"],
    "irritating": ["any potentially irritating ingredients present"],
    "actives": ["any active ingredients like retinol, AHA, BHA, vitamin C"]
  }
}

If the product is not in your knowledge, set product_found: false and return
your best estimate based on the brand and product name.`

  try {
    // Hard 8s abort so a slow model can never hang the lookup (and the UI spinner).
    const controller = new AbortController()
    const abort = setTimeout(() => controller.abort(), 8000)
    const res = await callAI({
      // Fast/cheap model — this is a simple "name → ingredients JSON" lookup.
      model: 'gpt-4o-mini',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
      signal: controller.signal,
    })
    clearTimeout(abort)
    if (!res.ok) return null
    const raw = (res.text || '').replace(/```json|```/g, '').trim()
    // Robustly extract the first balanced JSON object (model may append prose)
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end === -1 || end < start) return null
    const parsed = JSON.parse(raw.slice(start, end + 1))
    return parsed as IngredientsData
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { productId, all } = body as { productId?: string; all?: boolean }

  // Determine which products to look up
  let products: { id: string; brand: string | null; name: string }[] = []

  if (all) {
    // Background fill: all active products missing ingredient data
    const { data } = await supabase
      .from('user_products')
      .select('id, brand, name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('ingredients_data', null)
    products = data || []
  } else if (productId) {
    const { data } = await supabase
      .from('user_products')
      .select('id, brand, name')
      .eq('user_id', user.id)
      .eq('id', productId)
      .single()
    if (data) products = [data]
  } else {
    return NextResponse.json({ error: 'productId or all required' }, { status: 400 })
  }

  if (products.length === 0) {
    return NextResponse.json({ updated: 0, results: [] })
  }

  const results: { id: string; ingredients_data: IngredientsData }[] = []

  // Look up sequentially (limit to a sensible cap to stay within duration)
  for (const p of products.slice(0, 8)) {
    // Famous products resolve instantly from the local DB (e.g. SK-II via
    // "Sk2 Sk2"); everything else falls back to the fast AI lookup.
    const ingredientsData = lookupKnown(p.brand || '', p.name) || await lookupIngredients(p.brand || '', p.name)
    if (!ingredientsData) continue

    await supabase
      .from('user_products')
      .update({
        ingredients_data: ingredientsData,
        ingredients_fetched_at: new Date().toISOString(),
        product_full_name: ingredientsData.full_name || null,
      })
      .eq('id', p.id)
      .eq('user_id', user.id)

    results.push({ id: p.id, ingredients_data: ingredientsData })
  }

  return NextResponse.json({ updated: results.length, results })
}
