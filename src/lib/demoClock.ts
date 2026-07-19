// Demo clock — keeps the Zions POC "always current".
//
// The seed world was authored around a fixed anchor (Friday, June 5 2026): the Whitmore
// Quarterly Review that morning, the Nakamura live check-in, the upcoming Annual Planning,
// etc. Rather than rewrite every date, we keep the authored literals and *slide* the whole
// world so the anchor lands on the real "today". Every relative relationship between dates
// (this morning's review → in-progress distribution → next week's planning) is preserved,
// but the demo never looks stale.
//
// Usage in seeds:
//   startTime: shiftDateTime('2026-06-05T09:00:00')   // → today 09:00
//   startDate: shiftDate('2026-05-18')                // → (today − 18 days)
//
// `DEMO_TODAY` is captured once at module load so a single session is internally consistent.

/** The world's authored "today". All seed dates are expressed relative to this. */
export const ANCHOR_ISO = '2026-06-05'
const ANCHOR = new Date(2026, 5, 5) // local midnight, June 5 2026

/** Real "today" at local midnight, captured once per session. */
export const DEMO_TODAY: Date = (() => {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
})()

const DAY_MS = 86_400_000

/**
 * Whole-day delta (calendar days) between an ISO date/datetime and the anchor.
 * Parses the date portion as LOCAL (constructed from Y/M/D) so a bare 'YYYY-MM-DD'
 * isn't read as UTC midnight — which would drop a day in UTC-negative timezones.
 */
function dayDeltaFromAnchor(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const dOnly = new Date(y, m - 1, d)
  return Math.round((dOnly.getTime() - ANCHOR.getTime()) / DAY_MS)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Local 'YYYY-MM-DD' for a Date. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** DEMO_TODAY + n days (new Date, local midnight). */
export function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

/** Today as 'YYYY-MM-DD'. Drop-in for the old hardcoded TODAY constant. */
export const TODAY_ISO = toISODate(DEMO_TODAY)

/**
 * Slide a date-only literal ('YYYY-MM-DD') so the anchor maps to today.
 * Returns local 'YYYY-MM-DD'.
 */
export function shiftDate(iso: string): string {
  return toISODate(addDays(DEMO_TODAY, dayDeltaFromAnchor(iso)))
}

/**
 * Slide a datetime literal ('YYYY-MM-DDTHH:MM:SS') so the anchor maps to today,
 * preserving the authored wall-clock time. Returns a local (un-zoned) ISO string,
 * matching how the seeds were authored (so `new Date(...)` parses as local time).
 */
export function shiftDateTime(iso: string): string {
  const [, time = '00:00:00'] = iso.split('T')
  const shifted = addDays(DEMO_TODAY, dayDeltaFromAnchor(iso))
  return `${toISODate(shifted)}T${time}`
}

/** Today / Tomorrow / Yesterday, else weekday + short date — relative to DEMO_TODAY. */
export function relativeDayLabel(d: Date): string {
  const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((dOnly.getTime() - DEMO_TODAY.getTime()) / DAY_MS)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}
