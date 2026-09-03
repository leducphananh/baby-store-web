import { supabase } from '@/lib/supabase'
import { toReportQueryBounds } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'
import type { ProfitSummary } from '@/features/reports/types/profit'

/**
 * Gross Profit KPIs for one date range, aggregated entirely in Postgres via
 * `get_profit_summary()` (see its migration comment) — never fetched as raw
 * orders/order_items/order_item_batches and reduced client-side
 * (`dashboard-ui` skill rule 7a, requirement §15). Bounds go through the
 * shared `toReportQueryBounds()` (Phase 7.1) so this never re-implements
 * the Vietnam-timezone-safe conversion.
 */
export async function getProfitSummary(range: ReportDateRange): Promise<ProfitSummary> {
  const { fromIso, toExclusiveIso } = toReportQueryBounds(range)

  const { data, error } = await supabase.rpc('get_profit_summary', {
    p_from: fromIso,
    p_to_exclusive: toExclusiveIso,
  })
  if (error) throw error

  const row = data?.[0]
  return {
    totalRevenue: row?.total_revenue ?? 0,
    completedOrderCount: row?.completed_order_count ?? 0,
    totalCogs: row?.total_cogs ?? 0,
    grossProfit: row?.gross_profit ?? 0,
    ordersWithMissingCost: row?.orders_with_missing_cost ?? 0,
  }
}
