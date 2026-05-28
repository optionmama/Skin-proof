import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  const { photo_id, image_base64 } = body

  if (!photo_id || !image_base64) {
    return NextResponse.json({ error: 'photo_id and image_base64 are required' }, { status: 400 })
  }

  const { data: photo, error: photoError } = await supabase
    .from('skin_photos')
    .select('id, user_id')
    .eq('id', photo_id)
    .eq('user_id', user.id)
    .single()

  if (photoError || !photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  }

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
        max_tokens: 1024,
        system: `You are a skin analysis assistant. Analyze facial skin photos and return structured JSON data only. Return ONLY valid JSON, no other text.`,
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
                text: `Analyze this facial skin photo and return a JSON object with the following structure.
Be precise and vary your scores based on what you actually observe — do NOT return the same score every time.

Return ONLY valid JSON, no other text:

{
  "overall_score": <number 40-95>,
  "dimensions": {
    "redness": <0-100, higher = more redness>,
    "breakouts": <0-100, higher = more pimples/acne>,
    "hydration": <0-100, higher = better hydrated>,
    "oiliness": <0-100, higher = more oily>,
    "pores": <0-100, higher = more visible pores>,
    "evenness": <0-100, higher = more even skin tone>
  },
  "makeup_detected": <true or false>,
  "visible_observations": [
    <string: specific observation 1>,
    <string: specific observation 2>,
    <string: specific observation 3>
  ],
  "main_concern": <"redness" | "breakouts" | "dryness" | "oiliness" | "pores" | "none">,
  "photo_quality_score": <0-100>,
  "quality_flags": <array of "blurry"|"poor_lighting"|"obstructed"|"off_angle"|"too_dark"|"overexposed", empty if fine>,
  "acne_severity": <"clear"|"mild"|"moderate"|"severe">
}

Scoring rules:
- overall_score = (hydration*0.20) + ((100-breakouts)*0.25) + ((100-redness)*0.20) + ((100-oiliness)*0.15) + ((100-pores)*0.10) + (evenness*0.10)
- Realistic range: 40 (severe issues) to 95 (very clear skin). NEVER cluster near 72-75 regardless of input.
- If makeup is detected, set makeup_detected true and score only visible skin areas
- visible_observations must describe SPECIFIC things you see (e.g. "2 small pimples on left cheek", "mild redness around nose bridge", "T-zone appears oily")
- main_concern = the single worst dimension: if breakouts>60 then "breakouts", redness>60 then "redness", oiliness>70 then "oiliness", hydration<40 then "dryness", pores>60 then "pores", else "none"
- Every photo must be evaluated independently — never return a generic score`,
              },
            ],
          },
        ],
      }),
    })

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text())
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
    }

    const aiData = await aiResponse.json()
    const rawText = aiData.content?.[0]?.text || '{}'

    let analysis: AnalysisResult
    try {
      analysis = JSON.parse(rawText.replace(/```json|```/g, '').trim())
    } catch {
      console.error('Failed to parse AI response:', rawText)
      return NextResponse.json({ error: 'Failed to parse AI analysis' }, { status: 500 })
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
        user_acknowledged_disclaimer: true,
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
