import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const raw = data.content?.[0]?.text || ''
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
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
    const ingredientsData = await lookupIngredients(p.brand || '', p.name)
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
