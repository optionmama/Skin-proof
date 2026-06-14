// Shared helpers for generating AI free-text in the user's language.

/** Human-readable language name for embedding in prompts. */
export function aiLanguageName(lang?: string | null): string {
  if (lang === 'zh-TW') return 'Traditional Chinese (繁體中文)'
  if (lang === 'zh-CN') return 'Simplified Chinese (简体中文)'
  return 'English'
}

/**
 * Returns an instruction telling the model to write the listed natural-language
 * fields in the user's language. Empty string for English (no-op).
 *
 * `fields` should describe the JSON fields that hold human-readable prose, e.g.
 * '"visible_observations"'. JSON keys and enum values must stay in English so
 * the app can still parse and switch on them.
 */
export function aiLanguageInstruction(lang: string | null | undefined, fields: string): string {
  const name = aiLanguageName(lang)
  if (name === 'English') return ''
  return `\n\nIMPORTANT — LANGUAGE: Write all natural-language text in these fields in ${name}: ${fields}. Keep every JSON key and any enum/category values exactly as specified in English (do not translate keys or enums). Keep ingredient and product brand names in their original form.`
}
