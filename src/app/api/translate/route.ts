import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiLanguageName } from '@/lib/i18n/ai-lang'
import { callAI } from '@/lib/ai'

export const maxDuration = 30

const SUPPORTED = ['en', 'zh-TW', 'zh-CN']

/**
 * Translates short, already-generated AI strings (e.g. stored skin
 * observations) into the requested locale, so the UI never shows
 * mixed-language dynamic content. The caller decides when a translation is
 * actually needed (stored language ≠ current locale); this endpoint always
 * translates into `targetLang`, including back into English when the stored
 * text is in another language.
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
  // Unknown / unsupported target → return as-is rather than guessing.
  if (!targetLang || !SUPPORTED.includes(targetLang)) {
    return NextResponse.json({ texts })
  }

  const languageName = aiLanguageName(targetLang)

  try {
    const res = await callAI({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Translate each string in this JSON array into ${languageName}. These are short, non-diagnostic skin observations. Preserve meaning and an observational (non-medical) tone. Keep ingredient and brand names in their original form. Return ONLY a JSON array of the translated strings in the same order, no other text.

${JSON.stringify(texts)}`,
      }],
    })

    if (!res.ok) return NextResponse.json({ texts })
    const raw = (res.text || '').replace(/```json|```/g, '').trim()
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
