import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiLanguageInstruction } from '@/lib/i18n/ai-lang'
import { callAI } from '@/lib/ai'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { period, lang } = await request.json() as { period: 14 | 30 | 90; lang?: string }
  if (![14, 30, 90].includes(period)) return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
  const reportLang = lang ?? 'en'

  // Check if a report was already generated today
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('skin_reports')
    .select('id, report_data, generated_at')
    .eq('user_id', user.id)
    .eq('period_days', period)
    .gte('generated_at', today + 'T00:00:00')
    .single()

  // Reuse the cached report only if it's in the language the user is viewing in —
  // otherwise regenerate so insights never stay in a stale language.
  const cachedLang = (existing?.report_data as { language?: string } | null)?.language ?? 'en'
  if (existing && cachedLang === reportLang) {
    return NextResponse.json({ report: existing.report_data, cached: true })
  }

  // Fetch data for the period
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - period)
  const fromStr = fromDate.toISOString()

  const [{ data: checkins }, { data: photos }, { data: routines }] = await Promise.all([
    supabase.from('skin_checkins')
      .select('checkin_date, sleep_hours, stress_level, water_intake_ml, notes')
      .eq('user_id', user.id)
      .gte('checkin_date', fromDate.toISOString().split('T')[0])
      .order('checkin_date'),
    supabase.from('skin_photos')
      .select('overall_skin_score, main_concern, ai_analysis_raw, created_at')
      .eq('user_id', user.id)
      .gte('created_at', fromStr)
      .not('overall_skin_score', 'is', null)
      .order('created_at'),
    supabase.from('user_routines')
      .select('user_products(brand, name, category)')
      .eq('user_id', user.id)
      .eq('is_active', true),
  ])

  if (!checkins || checkins.length < 3) {
    return NextResponse.json({ error: 'Not enough data', checkinCount: checkins?.length || 0 }, { status: 422 })
  }

  const routineProducts = (routines || [])
    .map((r: { user_products: { brand?: string; name?: string } | null }) => r.user_products)
    .filter(Boolean)
    .map((p: { brand?: string; name?: string } | null) => `${p?.brand || ''} ${p?.name || ''}`.trim())
    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)

  const scores = (photos || []).map(p => p.overall_skin_score as number)
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  const firstScore = scores[0] ?? null
  const lastScore = scores[scores.length - 1] ?? null

  const prompt = `You are a skincare analyst. Analyze this user's skin data over the past ${period} days and generate a concise report.

Skin check-in data (${checkins.length} check-ins over ${period} days):
- Average sleep: ${checkins.reduce((s, c) => s + (c.sleep_hours || 0), 0) / checkins.length} hours
- Average stress: ${checkins.reduce((s, c) => s + (c.stress_level || 0), 0) / checkins.length} /5

AI skin scores (${scores.length} photos analyzed):
${(photos || []).map(p => `- ${new Date(p.created_at).toLocaleDateString('en-US', {month:'short',day:'numeric'})}: score ${p.overall_skin_score}, concern: ${p.main_concern || 'none'}`).join('\n')}

User's current routine: ${routineProducts.join(', ') || 'not set'}

Return ONLY valid JSON, no other text:
{
  "period_days": ${period},
  "overall_trend": "improving" or "stable" or "declining",
  "score_change": <number, positive = improved, last score minus first score>,
  "average_score": ${avgScore},
  "best_score": <number>,
  "best_score_date": "<date string>",
  "key_findings": ["<specific finding 1>", "<specific finding 2>", "<specific finding 3>"],
  "most_improved": "<dimension that improved most, e.g. hydration or redness>",
  "needs_attention": "<dimension that declined or needs focus>",
  "product_insights": [
    {"product": "<product name>", "correlation": "positive or negative or neutral", "insight": "<one sentence>"}
  ],
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>", "<actionable recommendation 3>"],
  "next_goal": "<one encouraging sentence about what to focus on next>"
}${aiLanguageInstruction(reportLang, '"key_findings", "most_improved", "needs_attention", each "product_insights[].insight", "recommendations", and "next_goal"')}`

  try {
    const aiResponse = await callAI({ model: 'gpt-4o', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] })

    if (!aiResponse.ok) throw new Error('AI call failed')
    const rawText = aiResponse.text || '{}'
    const reportData = JSON.parse(rawText.replace(/```json|```/g, '').trim())
    // Tag the report with the language it was generated in so we can detect
    // stale-language cache hits on future requests.
    reportData.language = reportLang

    // Store in DB — update today's row if one already exists (e.g. regenerating
    // in a new language), otherwise insert a fresh report.
    if (existing) {
      await supabase.from('skin_reports')
        .update({ report_data: reportData, generated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('skin_reports').insert({ user_id: user.id, period_days: period, report_data: reportData })
    }

    return NextResponse.json({ report: reportData, cached: false })
  } catch (err) {
    console.error('Report generation error:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
