import { NextResponse } from 'next/server'

// TEMPORARY diagnostic — replicates the FULL analyze-skin flow (download photo →
// base64 → gpt-4o vision with the real prompt) from the production environment,
// timing each step, to find where/why it fails. REMOVE after debugging.
export const maxDuration = 60

const PHOTO = 'https://udxodcbmzordjtskqeae.supabase.co/storage/v1/object/public/skin-photos/c7054aff-ec7f-4fb5-8d43-fa89156c4bfe/2026-06-30/front-1782852479046.jpg'

export async function GET() {
  const key = process.env.OPENAI_API_KEY || ''
  const out: Record<string, unknown> = { keyLen: key.length, keyTail: key.slice(-4) }
  const t0 = Date.now()
  try {
    const img = await fetch(PHOTO)
    out.imgStatus = img.status
    const buf = Buffer.from(await img.arrayBuffer())
    out.imgBytes = buf.length
    out.imgMs = Date.now() - t0
    const b64 = buf.toString('base64')

    const prompt = 'Analyze this facial skin photo. Return ONLY valid JSON: {"overall_score":<40-95>,"dimensions":{"redness":0,"breakouts":0,"hydration":0,"oiliness":0,"pores":0,"evenness":0},"makeup_detected":false,"visible_observations":["a","b"],"main_concern":"none","photo_quality_score":0,"quality_flags":[],"acne_severity":"clear"}'
    const t1 = Date.now()
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: 'You are a skin analysis assistant. Return ONLY valid JSON.' },
          { role: 'user', content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
            { type: 'text', text: prompt },
          ] },
        ],
      }),
    })
    const text = await r.text()
    out.openaiStatus = r.status
    out.openaiMs = Date.now() - t1
    out.totalMs = Date.now() - t0
    out.openaiBody = text.slice(0, 200)
  } catch (e) {
    out.error = String(e)
    out.totalMs = Date.now() - t0
  }
  return NextResponse.json(out)
}
