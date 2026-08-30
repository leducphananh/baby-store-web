const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Format a date for display in Vietnamese `dd/MM/yyyy` style.
 *
 * Accepts either:
 * - a plain `YYYY-MM-DD` string (Postgres `date` columns — manufacture
 *   date, expiry date, order date, import date, invoice date), formatted by
 *   reading the digits directly, with NO `Date`/timezone conversion. This is
 *   the case that's easy to get wrong: `new Date('2026-08-25')` is parsed as
 *   UTC midnight, and formatting it in a timezone behind UTC would silently
 *   render `24/08/2026` — a real date, not just a display, bug for this app
 *   (see CLAUDE.md §8, `vietnamese-business-ui`).
 * - a `Date` object or a full ISO timestamp string (Postgres `timestamptz`
 *   columns — `created_at`, `paid_at`, ...), formatted in the viewer's local
 *   time, which is the correct behavior for a genuine point-in-time value.
 */
export function formatDate(value: string | Date): string {
  if (typeof value === 'string' && DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
  }

  const date = value instanceof Date ? value : new Date(value)
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`
}

/**
 * Format a timestamp for display in Vietnamese `dd/MM/yyyy HH:mm` style, in
 * the viewer's local time. Use this only for genuine timestamps
 * (`created_at`, `paid_at`, `confirmed_at`, ...), never for date-only
 * business fields — those go through `formatDate`.
 */
export function formatDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  return `${formatDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

/** Today as a plain `YYYY-MM-DD` string in the viewer's local timezone. */
export function todayYmd(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

/**
 * Whole calendar days from `fromYmd` to `toYmd` (both plain `YYYY-MM-DD`),
 * e.g. `daysBetweenYmd('2026-01-01', '2026-01-31') === 30`. Positive when
 * `toYmd` is the later date, negative when earlier.
 *
 * Both ends are read at UTC midnight so a DST change or the viewer's
 * timezone can never shift the count by a day — these are calendar dates,
 * not instants (the same hazard `formatDate` warns about).
 */
export function daysBetweenYmd(fromYmd: string, toYmd: string): number {
  const from = Date.parse(`${fromYmd}T00:00:00Z`)
  const to = Date.parse(`${toYmd}T00:00:00Z`)
  return Math.round((to - from) / 86_400_000)
}

/**
 * Add (or, for a negative `days`, subtract) whole calendar days to `ymd`,
 * e.g. `addDaysYmd('2026-08-28', 3)` → `'2026-08-31'`,
 * `addDaysYmd('2026-08-05', -7)` → `'2026-07-29'`. UTC-midnight-anchored —
 * a pure calendar-date shift, not a timezone-sensitive instant (same
 * reasoning as `daysBetweenYmd`).
 */
export function addDaysYmd(ymd: string, days: number): string {
  const date = new Date(`${ymd}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * The day after `ymd` as `YYYY-MM-DD`, e.g. `nextDayYmd('2026-08-28')` →
 * `'2026-08-29'`. Used as an exclusive upper bound so an inclusive
 * `toDate` range still covers the whole of that last day.
 */
export function nextDayYmd(ymd: string): string {
  return addDaysYmd(ymd, 1)
}

/** First day of `ymd`'s calendar month, e.g. `startOfMonthYmd('2026-08-17')` → `'2026-08-01'`. */
export function startOfMonthYmd(ymd: string): string {
  return `${ymd.slice(0, 7)}-01`
}

/**
 * Last day of `ymd`'s calendar month, e.g. `endOfMonthYmd('2026-08-17')` →
 * `'2026-08-31'`, `endOfMonthYmd('2026-02-03')` → `'2026-02-28'`. Day 0 of
 * the next month is the last day of this one — same UTC-anchored calendar
 * math as `addDaysYmd`.
 */
export function endOfMonthYmd(ymd: string): string {
  const [year, month] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(year, month, 0))
  return date.toISOString().slice(0, 10)
}
