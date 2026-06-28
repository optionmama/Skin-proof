import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiLanguageInstruction, aiLanguageName } from '@/lib/i18n/ai-lang'
import { callAI } from '@/lib/ai'

export const maxDuration = 60

interface AnalysisResult {
  overall_score: number
  dimensions: {
    redness: number
    breakouts: number
    hydration: number
    oiliness: number
    pores: number
    evenness: number
  }
  makeup_detected: boolean
  visible_observations: string[]
  main_concern: 'redness' | 'breakouts' | 'dryness' | 'oiliness' | 'pores' | 'none'
  photo_quality_score: number
  quality_flags: string[]
  acne_severity: 'clear' | 'mild' | 'moderate' | 'severe'
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { photo_id, lang, acknowledged_disclaimer } = body
  let { image_base64 } = body

  if (!photo_id) {
    return NextResponse.json({ error: 'photo_id is required' }, { status: 400 })
  }

  const { data: photo, error: photoError } = await supabase
    .from('skin_photos')
    .select('id, user_id, storage_path')
    .eq('id', photo_id)
    .eq('user_id', user.id)
    .single()

  if (photoError || !photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  }

  // Reliability fix (Bug 2 "score disappeared"): the client used to POST the
  // image as a large base64 body in a fire-and-forget fetch, then immediately
  // navigate — which aborted the request mid-flight on mobile, so analysis
  // (and the score) silently never ran. Now the client only needs to send
  // photo_id (tiny body → survives navigation via keepalive); we read the
  // already-uploaded image from Supabase Storage here on the server.
  if (!image_base64 && photo.storage_path) {
    const { data: file, error: dlError } = await supabase.storage
      .from('skin-photos')
      .download(photo.storage_path)
    if (dlError || !file) {
      return NextResponse.json({ error: 'Could not load photo from storage' }, { status: 404 })
    }
    const buf = Buffer.from(await file.arrayBuffer())
    image_base64 = buf.toString('base64')
  }

  if (!image_base64) {
    return NextResponse.json({ error: 'No image available to analyze' }, { status: 400 })
  }

  // Vision model first for this structured "look at photo → output JSON scores"
  // task. gpt-4o is the strong vision model; if it errors or returns
  // unparseable output, we fall back to the cheaper/faster gpt-4o-mini (also
  // vision-capable) so a daily check-in still gets a score.
  const MODELS = ['gpt-4o', 'gpt-4o-mini']

  const langName = aiLanguageName(lang)
  const langSystem = langName === 'English'
    ? ''
    : ` The "visible_observations" strings MUST be written in ${langName}. All JSON keys and enum values stay in English. This language rule is mandatory.`

  const callModel = async (model: string) => {
    return callAI({
      model,
      max_tokens: 1024,
      system: `You are a skin analysis assistant. Return ONLY valid JSON — no markdown, no explanation.${langSystem}`,
      messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: image_base64 },
              },
              {
                type: 'text',
                text: `Analyze this facial skin photo carefully. You must evaluate what you ACTUALLY see in this specific photo — do not return generic or average scores.

Return ONLY valid JSON with no other text:

{
  "overall_score": <integer 40-95, weighted average of dimensions below>,
  "dimensions": {
    "redness": <0-100, 0=no redness, 100=very red/inflamed>,
    "breakouts": <0-100, 0=clear, 100=severe acne>,
    "hydration": <0-100, 0=very dry/flaky, 100=plump and dewy>,
    "oiliness": <0-100, 0=matte/dry, 100=very oily/shiny>,
    "pores": <0-100, 0=invisible, 100=very enlarged>,
    "evenness": <0-100, 0=very uneven/patchy, 100=perfectly even>
  },
  "makeup_detected": <true|false>,
  "visible_observations": [<specific observation 1>, <specific observation 2>, <specific observation 3>],
  "main_concern": <"redness"|"breakouts"|"dryness"|"oiliness"|"pores"|"none">,
  "photo_quality_score": <0-100>,
  "quality_flags": <array of "blurry"|"poor_lighting"|"obstructed"|"off_angle"|"too_dark"|"overexposed", empty if fine>,
  "acne_severity": <"clear"|"mild"|"moderate"|"severe">
}

Overall score formula:
(hydration × 0.20) + ((100 - breakouts) × 0.25) + ((100 - redness) × 0.20) + ((100 - oiliness) × 0.15) + ((100 - pores) × 0.10) + (evenness × 0.10)

Rules:
- Every photo must be evaluated independently — never return 72 or 75 by default
- visible_observations must name specific things (e.g. "3 small pimples on forehead", "dry patches on cheeks", "T-zone appears oily")
- If makeup detected, add "Makeup detected" to observations and score visible areas only
- Score range MUST vary: a clear skin photo should score 80+, a breakout photo 45-60${aiLanguageInstruction(lang, '"visible_observations" (each observation string)')}`,
              },
            ],
          },
        ],
    })
  }

  try {
    // Try each model in order; first one that returns parseable JSON wins.
    let analysis: AnalysisResult | null = null
    for (const model of MODELS) {
      try {
        const aiResponse = await callModel(model)
        if (!aiResponse.ok) {
          console.error(`AI API error (${model}):`, aiResponse.errorText)
          continue
        }
        const rawText = aiResponse.text || '{}'
        analysis = JSON.parse(rawText.replace(/```json|```/g, '').trim())
        break
      } catch (e) {
        console.error(`Model ${model} failed:`, e)
        continue
      }
    }

    if (!analysis) {
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
    }

    const clamp = (v: unknown, lo = 0, hi = 100): number => {
      const n = Number(v)
      return isNaN(n) ? 50 : Math.min(hi, Math.max(lo, n))
    }

    const dims = analysis.dimensions || {}
    const safeAnalysis = {
      overall_score: clamp(analysis.overall_score, 40, 95),
      dimensions: {
        redness:   clamp(dims.redness),
        breakouts: clamp(dims.breakouts),
        hydration: clamp(dims.hydration),
        oiliness:  clamp(dims.oiliness),
        pores:     clamp(dims.pores),
        evenness:  clamp(dims.evenness),
      },
      makeup_detected: Boolean(analysis.makeup_detected),
      visible_observations: Array.isArray(analysis.visible_observations)
        ? analysis.visible_observations.slice(0, 5)
        : [],
      main_concern: (['redness','breakouts','dryness','oiliness','pores','none'] as const)
        .includes(analysis.main_concern as never)
        ? analysis.main_concern
        : 'none' as const,
      photo_quality_score: clamp(analysis.photo_quality_score),
      quality_flags: Array.isArray(analysis.quality_flags) ? analysis.quality_flags.slice(0, 6) : [],
      acne_severity: (['clear','mild','moderate','severe'] as const).includes(analysis.acne_severity)
        ? analysis.acne_severity
        : 'clear' as const,
    }

    const { error: updateError } = await supabase
      .from('skin_photos')
      .update({
        ai_analysis_raw: safeAnalysis,
        overall_skin_score: safeAnalysis.overall_score,
        acne_severity: safeAnalysis.acne_severity,
        redness_score: safeAnalysis.dimensions.redness,
        hydration_score: safeAnalysis.dimensions.hydration,
        texture_score: safeAnalysis.dimensions.evenness,
        pigmentation_score: safeAnalysis.dimensions.evenness,
        photo_quality_score: safeAnalysis.photo_quality_score,
        quality_flags: safeAnalysis.quality_flags,
        detected_concerns: safeAnalysis.visible_observations,
        // dedicated columns for fast querying
        main_concern: safeAnalysis.main_concern,
        visible_observations: safeAnalysis.visible_observations,
        makeup_detected: safeAnalysis.makeup_detected,
        user_acknowledged_disclaimer: acknowledged_disclaimer ?? true,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', photo_id)

    if (updateError) {
      console.error('Failed to save analysis:', updateError)
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
    }

    return NextResponse.json({ success: true, photo_id, analysis: safeAnalysis })

  } catch (err) {
    console.error('Analysis error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
