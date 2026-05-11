import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

interface AnalysisResult {
  overall_score: number
  acne_severity: 'clear' | 'mild' | 'moderate' | 'severe'
  redness_score: number
  hydration_score: number
  texture_score: number
  pigmentation_score: number
  photo_quality_score: number
  quality_flags: string[]
  detected_concerns: string[]
  insights: string[]
  recommendations_note: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { photo_id, image_base64, acknowledged_disclaimer } = body

  if (!acknowledged_disclaimer) {
    return NextResponse.json(
      { error: 'User must acknowledge disclaimer before AI analysis' },
      { status: 400 }
    )
  }

  if (!photo_id || !image_base64) {
    return NextResponse.json({ error: 'photo_id and image_base64 are required' }, { status: 400 })
  }

  // Verify the photo belongs to this user
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
    // Call Claude Vision API for skin analysis
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
        system: `You are a skin analysis assistant. Analyze facial skin photos and return structured JSON data only.

IMPORTANT DISCLAIMER: You are NOT a medical device. Your analysis is for personal tracking purposes only and does NOT constitute medical diagnosis, advice, or treatment. Always recommend consulting a dermatologist for medical concerns.

Analyze the skin photo and return ONLY a valid JSON object (no markdown, no preamble) with these exact fields:
{
  "overall_score": <0-100, overall skin health score>,
  "acne_severity": <"clear" | "mild" | "moderate" | "severe">,
  "redness_score": <0-100, higher = more redness>,
  "hydration_score": <0-100, higher = better hydrated>,
  "texture_score": <0-100, higher = smoother texture>,
  "pigmentation_score": <0-100, higher = more even pigmentation>,
  "photo_quality_score": <0-100, quality of the photo itself>,
  "quality_flags": <array of: "blurry", "poor_lighting", "obstructed", "off_angle", "too_dark", "overexposed" — empty array if quality is good>,
  "detected_concerns": <array of observed skin characteristics, e.g. ["dry_patches", "mild_acne", "uneven_tone"] — factual observations only>,
  "insights": <array of 2-4 brief observational strings about what you see, framed as tracking observations, NOT diagnoses>,
  "recommendations_note": <single string: always include "For personalised skincare advice, consult a dermatologist.">
}

Be conservative and factual. If photo quality is poor (score < 40), note it and reduce confidence in scores. Never suggest medical treatments. Frame everything as personal tracking data.`,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: image_base64,
                },
              },
              {
                type: 'text',
                text: 'Analyze this skin photo for personal tracking purposes. Return only the JSON object.',
              },
            ],
          },
        ],
      }),
    })

    if (!aiResponse.ok) {
      const error = await aiResponse.text()
      console.error('AI API error:', error)
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
    }

    const aiData = await aiResponse.json()
    const rawText = aiData.content?.[0]?.text || '{}'

    let analysis: AnalysisResult
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      analysis = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse AI response:', rawText)
      return NextResponse.json({ error: 'Failed to parse AI analysis' }, { status: 500 })
    }

    // Validate and clamp scores
    const clamp = (val: unknown, min = 0, max = 100): number => {
      const n = Number(val)
      return isNaN(n) ? 50 : Math.min(max, Math.max(min, n))
    }

    const safeAnalysis = {
      overall_score: clamp(analysis.overall_score),
      acne_severity: ['clear', 'mild', 'moderate', 'severe'].includes(analysis.acne_severity)
        ? analysis.acne_severity
        : 'clear',
      redness_score: clamp(analysis.redness_score),
      hydration_score: clamp(analysis.hydration_score),
      texture_score: clamp(analysis.texture_score),
      pigmentation_score: clamp(analysis.pigmentation_score),
      photo_quality_score: clamp(analysis.photo_quality_score),
      quality_flags: Array.isArray(analysis.quality_flags) ? analysis.quality_flags.slice(0, 6) : [],
      detected_concerns: Array.isArray(analysis.detected_concerns) ? analysis.detected_concerns.slice(0, 10) : [],
      insights: Array.isArray(analysis.insights) ? analysis.insights.slice(0, 4) : [],
      recommendations_note: 'For personalised skincare advice, consult a dermatologist.',
    }

    // Store results in database
    const { error: updateError } = await supabase
      .from('skin_photos')
      .update({
        ai_analysis_raw: analysis,
        overall_skin_score: safeAnalysis.overall_score,
        acne_severity: safeAnalysis.acne_severity,
        redness_score: safeAnalysis.redness_score,
        hydration_score: safeAnalysis.hydration_score,
        texture_score: safeAnalysis.texture_score,
        pigmentation_score: safeAnalysis.pigmentation_score,
        photo_quality_score: safeAnalysis.photo_quality_score,
        quality_flags: safeAnalysis.quality_flags,
        user_acknowledged_disclaimer: true,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', photo_id)

    if (updateError) {
      console.error('Failed to save analysis:', updateError)
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      photo_id,
      analysis: safeAnalysis,
      disclaimer: 'This analysis is for personal tracking purposes only and does not constitute medical advice. Always consult a qualified dermatologist for skin concerns.',
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
