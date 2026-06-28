// Single place every API route goes through to call the LLM provider.
//
// Migrated from Anthropic Claude → OpenAI GPT-4o (the Anthropic organization on
// this account was disabled). To keep each route's prompt + parsing logic
// untouched, this helper accepts the *Anthropic-style* message shape the routes
// already build (string content, or content blocks with `{ type: 'image',
// source: { type: 'base64', media_type, data } }`) and converts it to the
// OpenAI Chat Completions format on the way out. Callers read `.text`, which is
// the assistant message text (the old `data.content[0].text`).

type AnthropicTextBlock = { type: 'text'; text: string }
type AnthropicImageBlock = {
  type: 'image'
  source: { type: 'base64'; media_type: string; data: string }
}
type AnthropicBlock = AnthropicTextBlock | AnthropicImageBlock
type AnthropicMessage = { role: 'user' | 'assistant'; content: string | AnthropicBlock[] }

export interface AICallParams {
  /** OpenAI model id, e.g. 'gpt-4o' or 'gpt-4o-mini'. */
  model: string
  max_tokens: number
  /** Optional system prompt (sent as a leading system message). */
  system?: string
  messages: AnthropicMessage[]
  /** Optional AbortSignal (e.g. for the lookup 8s timeout). */
  signal?: AbortSignal
}

export interface AIResult {
  ok: boolean
  status: number
  /** Assistant message text, '' when none. Equivalent to the old content[0].text. */
  text: string
  /** Raw error body, for logging. */
  errorText: string
}

type OpenAIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

function toOpenAIContent(content: string | AnthropicBlock[]): string | OpenAIContentPart[] {
  if (typeof content === 'string') return content
  return content.map((block): OpenAIContentPart => {
    if (block.type === 'image') {
      return {
        type: 'image_url',
        image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` },
      }
    }
    return { type: 'text', text: block.text }
  })
}

export async function callAI(params: AICallParams): Promise<AIResult> {
  const { model, max_tokens, system, messages, signal } = params

  const openaiMessages: { role: string; content: string | OpenAIContentPart[] }[] = []
  if (system) openaiMessages.push({ role: 'system', content: system })
  for (const m of messages) {
    openaiMessages.push({ role: m.role, content: toOpenAIContent(m.content) })
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY || ''}`,
      },
      body: JSON.stringify({ model, max_tokens, messages: openaiMessages }),
      signal,
    })

    if (!res.ok) {
      return { ok: false, status: res.status, text: '', errorText: await res.text() }
    }
    const data = await res.json()
    const text: string = data.choices?.[0]?.message?.content || ''
    return { ok: true, status: res.status, text, errorText: '' }
  } catch (err) {
    return { ok: false, status: 0, text: '', errorText: String(err) }
  }
}
