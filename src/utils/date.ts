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
