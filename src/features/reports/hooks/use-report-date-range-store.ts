import { create } from 'zustand'

import {
  buildReportDateRange,
  DEFAULT_REPORT_DATE_RANGE_PRESET,
} from '@/features/reports/utils/report-date-range'
import type { ReportDateRange, ReportDateRangePreset } from '@/features/reports/types/report'

/**
 * The currently-selected reporting period, shared across every report page
 * (`zustand` skill rule 1 names this exact case: "a global date-range
 * filter used by several report pages") — picked once on the Reports
 * landing page (or any report page) and carried over when navigating
 * between report pages, so switching from "Doanh thu" to "Lợi nhuận"
 * doesn't reset back to "Tháng này" each time.
 *
 * Client/UI state only, per `zustand` rule 2 — the report *data* for this
 * range always lives in a React Query hook keyed by `range`, never here.
 *
 * Deliberately NOT persisted to localStorage: unlike a sidebar preference,
 * a stale date range surviving days between sessions (e.g. "Tháng trước"
 * silently meaning a different month next time the app is opened) would be
 * confusing, not convenient — every fresh session starts at the explicit,
 * obvious default (CLAUDE.md §8's "obvious default" + requirement §36).
 */
type ReportDateRangeState = {
  range: ReportDateRange
  setPreset: (preset: Exclude<ReportDateRangePreset, 'custom'>) => void
  setCustomRange: (from: string, to: string) => void
}

export const useReportDateRangeStore = create<ReportDateRangeState>((set) => ({
  range: buildReportDateRange(DEFAULT_REPORT_DATE_RANGE_PRESET),
  setPreset: (preset) => set({ range: buildReportDateRange(preset) }),
  setCustomRange: (from, to) => set({ range: buildReportDateRange('custom', { from, to }) }),
}))
