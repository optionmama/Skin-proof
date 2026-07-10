import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiLanguageInstruction } from '@/lib/i18n/ai-lang'
import { callAI } from '@/lib/ai'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { period, lang, today: clientToday, force } = await request.json() as { period: 14 | 30 | 90; lang?: string; today?: string; force?: boolean }
  if (![14, 30, 90].includes(period)) return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
  const reportLang = lang ?? 'en'

  // Check if a report was already generated today. "Today" is the USER'S local
  // day, passed (validated) from the client — the server's UTC day is the wrong
  // day for part of every day in non-UTC timezones (2026-07-10 fix).
  const today = clientToday && /^\d{4}-\d{2}-\d{2}$/.test(clientToday)
    ? clientToday
    : new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('skin_reports')
    .select('id, report_data, generated_at')
    .eq('user_id', user.id)
    .eq('period_days', period)
    .gte('generated_at', today + 'T00:00:00')
    .single()

  // Reuse the cached report only if it's in the language the user is viewing in —
  // otherwise regenerate so insights never stay in a stale language. `force`
  // (the report page's 🔄 button) always regenerates.
  const cachedLang = (existing?.report_data as { language?: string } | null)?.language ?? 'en'
  if (existing && cachedLang === reportLang && !force) {
    return NextResponse.json({ report: existing.report_data, cached: true })
  }

  // Fetch data for the period — window anchored on the user's local `today`
  // so checkin_date (a local day key) filters line up with what the user sees.
  const fromDate = new Date(today + 'T00:00:00Z')
  fromDate.setUTCDate(fromDate.getUTCDate() - period)
  const fromDayKey = fromDate.toISOString().split('T')[0]
  const fromStr = fromDayKey + 'T00:00:00'

  const [{ data: checkins }, { data: photos }, { data: routines }] = await Promise.all([
    supabase.from('skin_checkins')
      .select('checkin_date, sleep_hours, stress_level, water_intake_ml, notes')
      .eq('user_id', user.id)
      .gte('checkin_date', fromDayKey)
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

TERMINOLOGY (mandatory when writing Chinese — use the app's canonical vocabulary):
redness = 「泛紅」 (NEVER 紅腫, 發紅 or 紅斑); oiliness = 「出油」 or 「油光」; comedones = 「粉刺」 (NEVER 黑頭); inflammatory breakouts = 「痘痘」; hydration = 「保濕」; pores = 「毛孔」; evenness = 「膚色均勻」.

RECOMMENDATIONS must be CONCRETE and tailored to the dimensions that actually need attention in THIS user's data — name the specific habit or ingredient, never vague filler. Playbook per concern:
- 泛紅/redness: 加強保濕、修護肌膚屏障；避免過度清潔與去角質；選擇無香精的鎮靜成分（積雪草、燕麥、神經醯胺）
- 出油/oiliness: 溫和清潔、切勿過度洗臉；改用清爽保濕；每週數次菸鹼醯胺或水楊酸
- 乾燥/dryness: 使用神經醯胺或玻尿酸保濕；避免熱水洗臉；洗後 3 分鐘內鎖水
- 痘痘/breakouts: 水楊酸或杜鵑花酸；避開厚重致粉刺產品；不要擠壓
- 粉刺、毛孔/comedones & pores: 每週 1–3 次水楊酸；每天防曬
- 膚色不均/uneven tone: 早上維他命C、白天確實防曬
Only mention sleep or stress if this user's sleep/stress data above is actually poor.

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
