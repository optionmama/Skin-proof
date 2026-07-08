import { NextResponse } from 'next/server'
export const maxDuration = 30
export async function GET() {
  const key = process.env.OPENAI_API_KEY || ''
  const info: Record<string, unknown> = { keyLen: key.length, keyTail: key.slice(-4) }
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }),
    })
    info.openaiStatus = r.status
    info.openaiBody = (await r.text()).slice(0, 400)
  } catch (e) { info.openaiError = String(e) }
  return NextResponse.json(info)
}
