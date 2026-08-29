/**
 * `import_date` is a `timestamptz` column but the store treats it as a plain
 * calendar date. To keep display stable (no day-drift from timezone
 * conversion — the hazard `@/utils/date` warns about), a picked
 * `YYYY-MM-DD` is stored at **local noon**: any reasonable timezone shift
 * from noon stays on the same date. This app's users are all in one
 * timezone (Vietnam), so this is safe and simple.
 */

const YMD = /^\d{4}-\d{2}-\d{2}$/

function ymdOf(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** `"2026-08-28"` → an ISO timestamp at local noon on that date. */
export function toImportDateISO(ymd: string): string {
  return new Date(`${ymd}T12:00:00`).toISOString()
}

/** An ISO timestamp (or `YYYY-MM-DD`) → `"YYYY-MM-DD"` for an `<input type="date">`. */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  if (YMD.test(value)) return value
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : ymdOf(date)
}

// `todayYmd` and `nextDay` (an exclusive upper bound for an inclusive date
// range) now live in the shared date utils — used across import receipts,
// purchase invoices, batch expiry and inventory transactions. Re-exported
// here so existing importers of this module keep working, but there is one
// definition of each.
export { todayYmd, nextDayYmd as nextDay } from '@/utils/date'
