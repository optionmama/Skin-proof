import { NextRequest, NextResponse } from 'next/server'
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

const REGION_CONTEXT: Record<string, string> = {
  Asia:      "Focus on brands available in Taiwan, Korea, Japan, Southeast Asia: COSRX, Innisfree, Laneige, Torriden, Some By Mi, Dr. Jart+, Klairs, Round Lab, Etude.",
  Americas:  "Focus on brands at US/Canada retailers (Sephora, Ulta, Target, Amazon, CVS): CeraVe, La Roche-Posay, Neutrogena, Paula's Choice, The Ordinary, Drunk Elephant, Tatcha, Kiehl's.",
  Europe:    "Focus on brands across Europe (Boots, Douglas, Sephora EU, pharmacies): La Roche-Posay, Avène, Bioderma, Eucerin, The Ordinary, Nuxe, Clarins, Vichy.",
  Australia: "Focus on brands in Australia/NZ (Priceline, Chemist Warehouse, Sephora AU): Aesop, The Ordinary, CeraVe, La Roche-Posay, Jurlique, Sukin.",
  Global:    "Focus on internationally available brands: The Ordinary, CeraVe, La Roche-Posay, COSRX, Paula's Choice, Kiehl's.",
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: routines }, { data: latestScan }, { data: userSettings }] = await Promise.all([
    supabase.from('skin_profiles').select('skin_type, primary_concerns').eq('user_id', user.id).single(),
    supabase
      .from('user_routines')
      .select('product_id, user_products(brand, name, notes)')
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
      .from('skin_photos')
      .select('overall_skin_score, created_at, ai_analysis_raw')
      .eq('user_id', user.id)
      .not('overall_skin_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase.from('user_settings').select('region').eq('user_id', user.id).single(),
  ])

  const skinType = profile?.skin_type || 'normal'
  const profileConcerns = profile?.primary_concerns || []
  // Region priority: saved setting > client-detected timezone > default
  const clientRegion = request.nextUrl.searchParams.get('region') || 'Asia'
  const userRegion = (userSettings as { region?: string } | null)?.region || clientRegion

  // Prefer latest scan data over onboarding profile
  const scanRaw = latestScan?.ai_analysis_raw as Record<string, unknown> | null
  const mainConcern = (scanRaw?.main_concern as string) || null
  const scanDate = latestScan?.created_at
    ? new Date(latestScan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  // Derive concerns: scan > profile
  const concerns = mainConcern
    ? [mainConcern === 'breakouts' ? 'acne' : mainConcern]
    : profileConcerns

  // Determine ingredient suggestions
  const concernKey = concerns.includes('acne') || mainConcern === 'breakouts' ? 'acne'
    : skinType === 'oily' || mainConcern === 'oiliness' ? 'oily'
    : skinType === 'dry'  || mainConcern === 'dryness'  ? 'dry'
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

  // Build current routine list for the prompt
  const routineList = (routines || [])
    .map((r: { user_products: { brand?: string; name?: string } | null }) => {
      const p = r.user_products
      return p ? `${p.brand || ''} ${p.name || ''}`.trim() : null
    })
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe

  // Build scan context
  const scanDimensions = scanRaw?.dimensions as Record<string, number> | null
  const scanObservations = scanRaw?.visible_observations as string[] | null

  const scanContext = latestScan ? `
AI scan from ${scanDate}:
- Main concern detected: ${mainConcern || 'none'}
- Skin dimensions (0-100, higher = worse): ${scanDimensions ? JSON.stringify(scanDimensions) : 'not available'}
- Visible observations: ${scanObservations?.join(', ') || 'not available'}` : `No scan yet — using skin profile: ${skinType} skin, concerns: ${profileConcerns.join(', ')}`

  const routineContext = routineList.length > 0
    ? `\nUser's current routine products (do NOT recommend these): ${routineList.join(', ')}`
    : ''

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
          content: `You are a skincare expert recommending products for a user in ${userRegion}.
${REGION_CONTEXT[userRegion] || REGION_CONTEXT['Global']}
${scanContext}
Skin type: ${skinType}${routineContext}

NEVER recommend these product types under any circumstances:
- Sunscreen, SPF products, UV protection
- Makeup, BB cream, CC cream, tinted moisturiser, foundation
- Cleansers, face wash, micellar water, makeup remover
- Body lotion, hand cream, lip balm
- Hair care products

ONLY recommend products from these categories:
- Serum (treatment serum for detected concern)
- Essence or toner (hydrating or exfoliating)
- Targeted moisturiser or gel cream (for detected skin type)
- Spot treatment (only if breakouts detected)
- Ampoule or booster (concentrated treatment)
- Eye cream (only if under-eye darkness or puffiness detected in scan)

Requirements:
1. Recommend 3 real products ACTUALLY AVAILABLE in ${userRegion}
2. Address the AI-detected main concern (${mainConcern || concerns[0] || 'general skin health'})
3. Do NOT recommend products already in the user's routine
4. Focus on: ${ingredientSuggestion.ingredients.join(', ')}

Return JSON array only, no other text:
[
  {
    "name": "product name",
    "brand": "brand name",
    "key_ingredient": "main active ingredient",
    "why": "one sentence why it addresses the detected concern",
    "price_range": "price in local currency if possible, otherwise USD",
    "available_at": "where to buy in ${userRegion}",
    "suitable_for": "skin type description"
  }
]`,
        }],
      }),
    })

    if (aiResponse.ok) {
      const data = await aiResponse.json()
      const raw = data.content?.[0]?.text || '[]'
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      const isSunscreen = (p: { name?: string; brand?: string; key_ingredient?: string; suitable_for?: string }) => {
        const text = `${p.name} ${p.brand} ${p.key_ingredient} ${p.suitable_for}`.toLowerCase()
        return ['spf', 'sunscreen', 'uv', 'sun protection', 'pa+'].some(kw => text.includes(kw))
      }
      aiProducts = parsed.filter((p: typeof parsed[0]) => !isSunscreen(p))
    }
  } catch {
    // AI call failed — return without products
  }

  return NextResponse.json({
    skinType,
    concerns,
    mainConcern,
    scanDate,
    hasScanData: !!latestScan,
    ingredientSuggestion,
    productWarnings,
    hasProducts,
    aiProducts,
    userRegion,
  })
}
