import { supabase } from '@/lib/supabase'
import { toReportQueryBounds } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'
import type { ProductPerformanceSummary } from '@/features/reports/types/product-performance'

/**
 * Product Performance KPIs for one date range, aggregated entirely in
 * Postgres via `get_product_performance_summary()` (see its migration
 * comment) — never fetched as raw order items and reduced client-side.
 */
export async function getProductPerformanceSummary(range: ReportDateRange): Promise<ProductPerformanceSummary> {
  const { fromIso, toExclusiveIso } = toReportQueryBounds(range)

  const { data, error } = await supabase.rpc('get_product_performance_summary', {
    p_from: fromIso,
    p_to_exclusive: toExclusiveIso,
  })
  if (error) throw error

  const row = data?.[0]
  return {
    productsSoldCount: row?.products_sold_count ?? 0,
    totalUnitsSold: row?.total_units_sold ?? 0,
    topRevenueProduct: row?.top_revenue_product_id
      ? {
          id: row.top_revenue_product_id,
          name: row.top_revenue_product_name ?? '',
          revenue: row.top_revenue_amount ?? 0,
        }
      : null,
    topProfitProduct: row?.top_profit_product_id
      ? {
          id: row.top_profit_product_id,
          name: row.top_profit_product_name ?? '',
          grossProfit: row.top_profit_amount ?? 0,
        }
      : null,
  }
}
