import { supabase } from '@/lib/supabase'
import { toReportQueryBounds } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'
import type { ProfitDailyPoint } from '@/features/reports/types/profit'

/**
 * Daily revenue/COGS/gross-profit series for one date range, zero-filled
 * and grouped by Vietnam-local calendar date entirely in Postgres via
 * `get_profit_timeseries()` (see its migration comment) — one row per day
 * in range, ascending, ready to feed a chart directly with no client-side
 * date-bucketing or COGS math.
 */
export async function getProfitTimeseries(range: ReportDateRange): Promise<ProfitDailyPoint[]> {
  const { fromIso, toExclusiveIso } = toReportQueryBounds(range)

  const { data, error } = await supabase.rpc('get_profit_timeseries', {
    p_from: fromIso,
    p_to_exclusive: toExclusiveIso,
  })
  if (error) throw error

  return (data ?? []).map((row) => ({
    reportDate: row.report_date,
    orderCount: row.order_count,
    revenue: row.revenue,
    cogs: row.cogs,
    grossProfit: row.gross_profit,
  }))
}
