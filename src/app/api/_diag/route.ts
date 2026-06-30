import { NextResponse } from 'next/server'

// TEMPORARY diagnostic endpoint — checks whether the production OPENAI_API_KEY is
// configured and can actually reach OpenAI. Exposes only the key length + last 4
// chars (not the key). REMOVE after debugging.
export const maxDuration = 30

export async function GET() {
  const key = process.env.OPENAI_API_KEY || ''
  const info: Record<string, unknown> = {
    hasKey: key.length > 0,
    keyLen: key.length,
    keyTail: key.slice(-4),
  }
  if (!key) return NextResponse.json({ ...info, openai: 'no key set' })

  try {
    const t0 = Date.now()
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'say hi' }],
      }),
    })
    const text = await r.text()
    info.openaiStatus = r.status
    info.openaiMs = Date.now() - t0
    info.openaiBody = text.slice(0, 300)
  } catch (e) {
    info.openaiError = String(e)
  }
  return NextResponse.json(info)
}
