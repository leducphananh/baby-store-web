import { supabase } from '@/lib/supabase'
import { toReportQueryBounds } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'
import type { CategoryPerformanceRow } from '@/features/reports/types/product-performance'

/**
 * Category-level sales performance for one date range, aggregated entirely
 * in Postgres via `get_category_performance()` (see its migration comment)
 * — a product with no category groups under one `categoryId: null` row,
 * never dropped ("Chưa phân loại", requirement §38).
 */
export async function getCategoryPerformance(range: ReportDateRange): Promise<CategoryPerformanceRow[]> {
  const { fromIso, toExclusiveIso } = toReportQueryBounds(range)

  const { data, error } = await supabase.rpc('get_category_performance', {
    p_from: fromIso,
    p_to_exclusive: toExclusiveIso,
  })
  if (error) throw error

  return (data ?? []).map((row) => ({
    categoryId: row.category_id,
    categoryName: row.category_name,
    productCountSold: row.product_count_sold,
    soldQuantity: row.sold_quantity,
    orderCount: row.order_count,
    revenue: row.revenue,
    cogs: row.cogs,
    grossProfit: row.gross_profit,
  }))
}
