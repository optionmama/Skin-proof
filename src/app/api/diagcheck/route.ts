import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const maxDuration = 60
export async function GET() {
  const out: Record<string, unknown> = {}
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  out.hasServiceKey = !!svc
  const sb = createClient(url, svc || anon)
  try {
    const { data: photo, error: selErr } = await sb.from('skin_photos')
      .select('id, storage_path, user_id')
      .eq('user_id', 'fe753d5d-ca66-4637-a938-dfad14f3f516')
      .is('overall_skin_score', null)
      .order('created_at', { ascending: false }).limit(1).single()
    out.selErr = selErr?.message || null
    out.photoId = photo?.id
    if (photo) {
      const t0 = Date.now()
      const { data: file, error: dlErr } = await sb.storage.from('skin-photos').download(photo.storage_path)
      out.dlErr = dlErr ? String((dlErr as Error).message || dlErr) : null
      out.dlMs = Date.now() - t0
      if (file) {
        const b64 = Buffer.from(await file.arrayBuffer()).toString('base64')
        out.b64Len = b64.length
        const key = process.env.OPENAI_API_KEY || ''
        const t1 = Date.now()
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: 'gpt-4o', max_tokens: 300, messages: [{ role: 'system', content: 'Return ONLY JSON.' }, { role: 'user', content: [{ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } }, { type: 'text', text: 'Return {"overall_score":70}' }] }] }) })
        out.openaiStatus = r.status
        out.openaiMs = Date.now() - t1
        // test write (service role bypasses RLS; proves columns/constraints OK)
        const { error: updErr } = await sb.from('skin_photos').update({ analyzed_at: new Date().toISOString() }).eq('id', photo.id)
        out.updErr = updErr?.message || 'ok(write path fine)'
        out.totalMs = Date.now() - t0
      }
    }
  } catch (e) { out.error = String(e) }
  return NextResponse.json(out)
}
