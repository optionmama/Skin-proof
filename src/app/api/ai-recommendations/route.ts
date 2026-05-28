import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

const COMEDOGENIC = ['isopropyl myristate', 'coconut oil', 'lanolin', 'cocoa butter', 'wheat germ oil']
const IRRITATING  = ['fragrance', 'alcohol denat', 'sodium lauryl sulfate']

const INGREDIENT_MAP: Record<string, { ingredients: string[]; reason: string }> = {
  dry:         { ingredients: ['Hyaluronic Acid', 'Ceramide', 'Squalane'],                            reason: 'These ingredients restore moisture and reinforce your skin barrier.' },
  oily:        { ingredients: ['Niacinamide', 'BHA (Salicylic Acid)', 'Zinc'],                        reason: 'These help regulate sebum production and keep pores clear.' },
  sensitive:   { ingredients: ['Centella Asiatica', 'Allantoin', 'Panthenol'],                        reason: 'These soothe reactive skin and reduce redness without irritation.' },
  combination: { ingredients: ['Niacinamide', 'Light Hyaluronic Acid'],                               reason: 'These balance the oily and dry zones without over-moisturising.' },
  normal:      { ingredients: ['Vitamin C', 'Peptides', 'Niacinamide'],                               reason: 'These maintain healthy skin and support long-term clarity.' },
  acne:        { ingredients: ['BHA (Salicylic Acid)', 'Azelaic Acid', 'Tea Tree (low %)'],           reason: 'These target breakouts and calm inflammation without over-drying.' },
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: routines }] = await Promise.all([
    supabase.from('skin_profiles').select('skin_type, primary_concerns').eq('user_id', user.id).single(),
    supabase
      .from('user_routines')
      .select('product_id, user_products(brand, name, notes)')
      .eq('user_id', user.id)
      .eq('is_active', true),
  ])

  const skinType  = profile?.skin_type    || 'normal'
  const concerns  = profile?.primary_concerns || []

  // Determine ingredient suggestions
  const concernKey = concerns.includes('acne') ? 'acne'
    : skinType === 'oily' ? 'oily'
    : skinType === 'dry'  ? 'dry'
    : skinType === 'sensitive' ? 'sensitive'
    : skinType === 'combination' ? 'combination'
    : 'normal'
  const ingredientSuggestion = INGREDIENT_MAP[concernKey]

  // Check current products for problem ingredients
  const productWarnings: { name: string; ingredient: string; concern: string }[] = []
  const hasBreakoutConcern = concerns.includes('acne') || concerns.includes('oiliness') || skinType === 'oily'

  if (hasBreakoutConcern && routines) {
    for (const r of routines) {
      const prod = r.user_products as { brand?: string; name?: string; notes?: string } | null
      if (!prod) continue
      const notesLower = (prod.notes || '').toLowerCase()
      const flagged = [...COMEDOGENIC, ...IRRITATING].find(c => notesLower.includes(c))
      if (flagged) {
        productWarnings.push({
          name: `${prod.brand || ''} ${prod.name || ''}`.trim(),
          ingredient: flagged,
          concern: COMEDOGENIC.includes(flagged) ? 'clog pores' : 'irritate skin',
        })
      }
    }
  }

  const hasProducts = routines && routines.length > 0

  // Call Claude for product recommendations
  let aiProducts: { name: string; brand: string; key_ingredient: string; why: string; price_range: string; suitable_for: string }[] = []

  try {
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Based on skin type: ${skinType}, concerns: ${concerns.join(', ') || 'none'}, recommend 3 real skincare products available in Asia that contain ${ingredientSuggestion.ingredients[0]}.

Return JSON array only, no other text:
[
  {
    "name": "product name",
    "brand": "brand name",
    "key_ingredient": "main active ingredient",
    "why": "one sentence why it suits this skin type",
    "price_range": "approximate price in USD",
    "suitable_for": "skin type description"
  }
]`,
        }],
      }),
    })

    if (aiResponse.ok) {
      const data = await aiResponse.json()
      const raw = data.content?.[0]?.text || '[]'
      aiProducts = JSON.parse(raw.replace(/```json|```/g, '').trim())
    }
  } catch {
    // AI call failed — return without products
  }

  return NextResponse.json({
    skinType,
    concerns,
    ingredientSuggestion,
    productWarnings,
    hasProducts,
    aiProducts,
  })
}
