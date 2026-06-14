import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiLanguageInstruction } from '@/lib/i18n/ai-lang'

export const maxDuration = 30

const REGION_CONTEXT: Record<string, string> = {
  Asia:      "Focus on brands available in Taiwan, Korea, Japan, Southeast Asia: COSRX, Innisfree, Laneige, Torriden, Some By Mi, Dr. Jart+, Klairs, Round Lab, Etude.",
  Americas:  "Focus on brands at US/Canada retailers (Sephora, Ulta, Target, Amazon, CVS): CeraVe, La Roche-Posay, Neutrogena, Paula's Choice, The Ordinary, Drunk Elephant, Tatcha, Kiehl's.",
  Europe:    "Focus on brands across Europe (Boots, Douglas, Sephora EU, pharmacies): La Roche-Posay, Avène, Bioderma, Eucerin, The Ordinary, Nuxe, Clarins, Vichy.",
  Australia: "Focus on brands in Australia/NZ (Priceline, Chemist Warehouse, Sephora AU): Aesop, The Ordinary, CeraVe, La Roche-Posay, Jurlique, Sukin.",
  Global:    "Focus on internationally available brands: The Ordinary, CeraVe, La Roche-Posay, COSRX, Paula's Choice, Kiehl's.",
}

const isSunscreen = (p: { name?: string; brand?: string; key_ingredient?: string; category?: string }) => {
  const text = `${p.name} ${p.brand} ${p.key_ingredient} ${p.category}`.toLowerCase()
  return ['spf', 'sunscreen', 'uv', 'sun protection', 'pa+', 'cleanser', 'face wash', 'micellar'].some(kw => text.includes(kw))
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const {
    brand = '', productName = '', category = 'serum',
    flaggedIngredient = '', detectedConcern = 'general skin health',
    region = 'Asia', lang = 'en',
  } = body as {
    brand?: string; productName?: string; category?: string
    flaggedIngredient?: string; detectedConcern?: string; region?: string; lang?: string
  }

  const { data: profile } = await supabase
    .from('skin_profiles')
    .select('skin_type')
    .eq('user_id', user.id)
    .single()
  const skinType = profile?.skin_type || 'normal'

  const prompt = `The user's routine product "${brand} ${productName}" (${category}) was flagged because it contains ${flaggedIngredient} which may worsen their detected ${detectedConcern}.

Recommend 2-3 alternative products in the SAME category (${category}) that perform the same function but WITHOUT the problematic ingredient.

${REGION_CONTEXT[region] || REGION_CONTEXT['Global']}
Available in: ${region}
User's skin type: ${skinType}
Detected concern: ${detectedConcern}

NEVER recommend: sunscreen, SPF, makeup, cleanser, body lotion.

Return ONLY valid JSON, no other text:
[{
  "name": "product name",
  "brand": "brand name",
  "category": "${category}",
  "key_ingredient": "main active ingredient",
  "why": "why this is a better alternative for today's skin",
  "price_range": "price",
  "available_at": "where to buy in ${region}"
}]${aiLanguageInstruction(lang, '"why", "price_range", and "available_at"')}`

  let products: Record<string, string>[] = []
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
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (res.ok) {
      const data = await res.json()
      const raw = (data.content?.[0]?.text || '[]').replace(/```json|```/g, '').trim()
      const start = raw.indexOf('[')
      const end = raw.lastIndexOf(']')
      const slice = start !== -1 && end !== -1 && end > start ? raw.slice(start, end + 1) : '[]'
      const parsed = JSON.parse(slice)
      products = Array.isArray(parsed) ? parsed.filter((p) => !isSunscreen(p)) : []
    }
  } catch {
    // fail silently
  }

  return NextResponse.json({ products, region, skinType })
}
