import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiLanguageName } from '@/lib/i18n/ai-lang'

export const maxDuration = 30

/**
 * Translates short, already-generated AI strings (e.g. historical skin
 * observations that were stored in English) into the user's current language,
 * so the UI never shows mixed-language dynamic content. Forward-generated
 * content is already localized at creation; this only backfills old data.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { texts, targetLang } = await request.json().catch(() => ({})) as {
    texts?: string[]; targetLang?: string
  }

  if (!Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json({ texts: [] })
  }
  // Nothing to do for English (source language) or unknown targets.
  if (!targetLang || targetLang === 'en') {
    return NextResponse.json({ texts })
  }

  const languageName = aiLanguageName(targetLang)

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
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Translate each string in this JSON array into ${languageName}. These are short, non-diagnostic skin observations. Preserve meaning and an observational (non-medical) tone. Keep ingredient and brand names in their original form. Return ONLY a JSON array of the translated strings in the same order, no other text.

${JSON.stringify(texts)}`,
        }],
      }),
    })

    if (!res.ok) return NextResponse.json({ texts })
    const data = await res.json()
    const raw = (data.content?.[0]?.text || '').replace(/```json|```/g, '').trim()
    const start = raw.indexOf('[')
    const end = raw.lastIndexOf(']')
    if (start === -1 || end === -1 || end <= start) return NextResponse.json({ texts })
    const parsed = JSON.parse(raw.slice(start, end + 1))
    if (Array.isArray(parsed) && parsed.length === texts.length) {
      return NextResponse.json({ texts: parsed.map(String) })
    }
    return NextResponse.json({ texts })
  } catch {
    return NextResponse.json({ texts })
  }
}
