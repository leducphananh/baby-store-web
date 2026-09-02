import { supabase } from '@/lib/supabase'
import { toReportQueryBounds } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'
import type { RevenueDailyPoint } from '@/features/reports/types/revenue'

/**
 * Daily revenue/order-count series for one date range, zero-filled and
 * grouped by Vietnam-local calendar date entirely in Postgres via
 * `get_revenue_timeseries()` (see its migration comment) — one row per day
 * in range, ascending, ready to feed a chart directly with no client-side
 * date-bucketing.
 */
export async function getRevenueTimeseries(range: ReportDateRange): Promise<RevenueDailyPoint[]> {
  const { fromIso, toExclusiveIso } = toReportQueryBounds(range)

  const { data, error } = await supabase.rpc('get_revenue_timeseries', {
    p_from: fromIso,
    p_to_exclusive: toExclusiveIso,
  })
  if (error) throw error

  return (data ?? []).map((row) => ({
    reportDate: row.report_date,
    orderCount: row.order_count,
    revenue: row.revenue,
  }))
}
