/**
 * SINGLE source of truth for "which day is it" (2026-07-10 audit).
 *
 * The app used to compute "today" as the UTC date
 * (`new Date().toISOString().split('T')[0]`) in 11 places. For users away from
 * UTC that is the WRONG day for part of every day — e.g. in Taipei (UTC+8) the
 * day only flipped at 8 AM local: a 5 AM check-in was recorded to *yesterday*
 * (and, via the one-per-day upsert, could overwrite yesterday's check-in), the
 * "scan today" red-dot went quiet, and photo labels split one local day in two.
 *
 * Rules going forward:
 * - CLIENT code computes day keys with `localDayKey()` (device timezone).
 * - SERVER code (server components / API routes) cannot see the device clock:
 *   pages read the `TZ_COOKIE` (set by DashboardNav on every dashboard page)
 *   and use `dayKeyInTZ()` / `formatDayInTZ()`; API routes accept a validated
 *   `today` day-key from the client body. Fallback is UTC (old behaviour).
 * - `checkin_date` and every other stored day key is the user's LOCAL day.
 * - NEVER reintroduce `toISOString().split('T')[0]` as "today" in UI logic.
 */

/** Cookie carrying the device's IANA timezone for server-side rendering. */
export const TZ_COOKIE = 'sp_tz'

const pad = (n: number) => String(n).padStart(2, '0')

// Cookie values may arrive URL-encoded ("Asia%2FTaipei") depending on how the
// runtime surfaces them; an encoded tz would make Intl throw and silently fall
// back to UTC — defeating the whole fix. Decode defensively.
function normalizeTz(tz: string | undefined | null): string | undefined {
  if (!tz) return undefined
  try {
    return tz.includes('%') ? decodeURIComponent(tz) : tz
  } catch {
    return tz
  }
}

/** YYYY-MM-DD in the DEVICE's local timezone. Client-side use. */
export function localDayKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * YYYY-MM-DD in an explicit IANA timezone (server-side; tz from TZ_COOKIE).
 * Falls back to the UTC date when tz is missing/invalid (first request ever,
 * cookies cleared) — self-heals on the next page load.
 */
export function dayKeyInTZ(tz: string | undefined | null, date: Date = new Date()): string {
  try {
    const zone = normalizeTz(tz)
    if (!zone) throw new Error('no tz')
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(date)
  } catch {
    return date.toISOString().split('T')[0]
  }
}

/** Hour of day (0–23) in an explicit timezone; falls back to UTC. */
export function hourInTZ(tz: string | undefined | null, date: Date = new Date()): number {
  try {
    const zone = normalizeTz(tz)
    if (!zone) throw new Error('no tz')
    return Number(new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hour: 'numeric', hourCycle: 'h23',
    }).format(date))
  } catch {
    return date.getUTCHours()
  }
}

/**
 * Human date label (e.g. "July 9") for a timestamp, rendered in the user's
 * timezone on the SERVER (tz from TZ_COOKIE). Falls back to UTC.
 */
export function formatDayInTZ(
  ts: string | Date,
  tz: string | undefined | null,
  locale = 'en-US',
  opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' }
): string {
  const d = new Date(ts)
  try {
    return new Intl.DateTimeFormat(locale, { ...opts, timeZone: normalizeTz(tz) || 'UTC' }).format(d)
  } catch {
    return new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' }).format(d)
  }
}

/** Shift a YYYY-MM-DD day key by ±n days (pure string math via UTC epoch). */
export function shiftDayKey(dayKey: string, days: number): string {
  const d = new Date(dayKey + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}
