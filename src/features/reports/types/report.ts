/**
 * Reporting date-range primitives (Phase 7.1 foundation), shared by every
 * future report page (`dashboard-ui` skill rule 5/6) — not redefined per
 * report.
 */
export type ReportDateRangePreset = 'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'custom'

/**
 * A resolved, concrete reporting period. `from`/`to` are always plain
 * `YYYY-MM-DD` business-local calendar dates (inclusive on both ends),
 * even when `preset` is a named preset — a report query never has to
 * re-derive bounds from `preset` itself, it just reads `from`/`to`.
 * `preset` is kept alongside only so the picker UI can show which named
 * option (if any) produced this range.
 */
export type ReportDateRange = {
  preset: ReportDateRangePreset
  from: string
  to: string
}
