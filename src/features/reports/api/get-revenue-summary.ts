import { supabase } from '@/lib/supabase'
import { toReportQueryBounds } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'
import type { RevenueSummary } from '@/features/reports/types/revenue'

/**
 * Revenue KPIs for one date range, aggregated entirely in Postgres via
 * `get_revenue_summary()` (see its migration comment) — never fetched as
 * raw orders and reduced client-side (`dashboard-ui` skill rule 7a).
 * Bounds go through the shared `toReportQueryBounds()` (Phase 7.1) so this
 * never re-implements the Vietnam-timezone-safe conversion.
 */
export async function getRevenueSummary(range: ReportDateRange): Promise<RevenueSummary> {
  const { fromIso, toExclusiveIso } = toReportQueryBounds(range)

  const { data, error } = await supabase.rpc('get_revenue_summary', {
    p_from: fromIso,
    p_to_exclusive: toExclusiveIso,
  })
  if (error) throw error

  const row = data?.[0]
  return {
    totalRevenue: row?.total_revenue ?? 0,
    completedOrderCount: row?.completed_order_count ?? 0,
    averageOrderValue: row?.average_order_value ?? 0,
    paidAmount: row?.paid_amount ?? 0,
    outstandingAmount: row?.outstanding_amount ?? 0,
  }
}
