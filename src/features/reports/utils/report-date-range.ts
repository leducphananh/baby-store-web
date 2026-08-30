import { addDaysYmd, endOfMonthYmd, startOfMonthYmd, todayYmd } from '@/utils/date'
import type { ReportDateRange, ReportDateRangePreset } from '@/features/reports/types/report'

/** Vietnam has no daylight-saving time — a fixed UTC+7 offset is correct
 * year-round, no IANA timezone database needed for this. */
const BUSINESS_UTC_OFFSET = '+07:00'

export const DEFAULT_REPORT_DATE_RANGE_PRESET: ReportDateRangePreset = 'this_month'

export const REPORT_DATE_RANGE_PRESET_LABEL: Record<ReportDateRangePreset, string> = {
  today: 'Hôm nay',
  last_7_days: '7 ngày gần đây',
  last_30_days: '30 ngày gần đây',
  this_month: 'Tháng này',
  last_month: 'Tháng trước',
  custom: 'Tùy chọn',
}

/** Every preset except `custom`, in display order — `custom` has no formula, it's whatever the user picks. */
export const NAMED_REPORT_DATE_RANGE_PRESETS: readonly Exclude<ReportDateRangePreset, 'custom'>[] = [
  'today',
  'last_7_days',
  'last_30_days',
  'this_month',
  'last_month',
]

/**
 * Resolves a named preset into concrete `{ from, to }` bounds (both
 * inclusive `YYYY-MM-DD`), anchored to the viewer's actual local calendar
 * day via `todayYmd()` — never `Date.toISOString()`/UTC slicing, which
 * would silently shift "today" near a UTC day boundary (see the Phase 7.1
 * completion report's Timezone section).
 *
 * "Tháng này"/"Tháng trước" resolve to the *full* calendar month (1st to
 * last day), not "month to date" — a report for a range that extends
 * slightly into the future simply has no data for those not-yet-happened
 * days (handled by the normal empty-state, not a special case here).
 */
export function getPresetDateRange(
  preset: Exclude<ReportDateRangePreset, 'custom'>,
  today: string = todayYmd(),
): { from: string; to: string } {
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'last_7_days':
      return { from: addDaysYmd(today, -6), to: today }
    case 'last_30_days':
      return { from: addDaysYmd(today, -29), to: today }
    case 'this_month':
      return { from: startOfMonthYmd(today), to: endOfMonthYmd(today) }
    case 'last_month': {
      const lastDayOfPreviousMonth = addDaysYmd(startOfMonthYmd(today), -1)
      return { from: startOfMonthYmd(lastDayOfPreviousMonth), to: lastDayOfPreviousMonth }
    }
  }
}

/**
 * Builds a full `ReportDateRange` for any preset, including `custom` (which
 * just carries the caller-supplied bounds through as-is — including a
 * currently-invalid `from > to` pair, so a picker mid-edit stays fully
 * controllable; see `isValidReportDateRange`).
 */
export function buildReportDateRange(
  preset: ReportDateRangePreset,
  custom?: { from: string; to: string },
): ReportDateRange {
  if (preset === 'custom') {
    return { preset, from: custom?.from ?? todayYmd(), to: custom?.to ?? todayYmd() }
  }
  return { preset, ...getPresetDateRange(preset) }
}

/** `from <= to` — the only validity rule for a report date range (see requirement §47). */
export function isValidReportDateRange(range: ReportDateRange): boolean {
  return range.from <= range.to
}

/**
 * Converts a business-local `ReportDateRange` into unambiguous instant
 * bounds for a `timestamptz` query — `toExclusive` is the start of the day
 * *after* `range.to`, so a `>= from AND < toExclusive` query correctly
 * includes the whole of the last day (same inclusive-end/exclusive-upper-
 * bound convention `get-orders.ts` already uses for `order_date`).
 *
 * Both bounds carry an explicit `+07:00` offset rather than a bare
 * `YYYY-MM-DD` string. Supabase's Postgres session runs in UTC by default
 * (verified while building this phase) — comparing a bare date string to a
 * `timestamptz` column would implicitly cast using that UTC session
 * timezone, not the store's actual local day, silently misfiling any order
 * completed between 00:00 and 07:00 Vietnam time into the previous
 * business day. An explicit offset makes the instant unambiguous
 * regardless of session timezone, so this is safe to use from any query
 * path (RPC parameter, PostgREST `.gte()/.lt()` filter, or raw SQL).
 */
export function toReportQueryBounds(range: ReportDateRange): { fromIso: string; toExclusiveIso: string } {
  return {
    fromIso: `${range.from}T00:00:00${BUSINESS_UTC_OFFSET}`,
    toExclusiveIso: `${addDaysYmd(range.to, 1)}T00:00:00${BUSINESS_UTC_OFFSET}`,
  }
}
