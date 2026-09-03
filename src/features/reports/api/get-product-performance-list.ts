import { supabase } from '@/lib/supabase'
import { toReportQueryBounds } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'
import type {
  ProductPerformanceFilters,
  ProductPerformancePage,
} from '@/features/reports/types/product-performance'

/**
 * Paginated, sorted, filtered per-product sales performance — search,
 * category filter, sorting, and pagination all run inside
 * `get_product_performance_list()` in Postgres (see its migration comment),
 * never fetched in full and sliced/sorted in the browser. `total` comes
 * from the RPC's own `total_count` window column (the full matching row
 * count before `limit`/`offset`), same server-pagination shape as
 * `getProducts()`.
 */
export async function getProductPerformanceList(
  range: ReportDateRange,
  filters: ProductPerformanceFilters,
): Promise<ProductPerformancePage> {
  const { fromIso, toExclusiveIso } = toReportQueryBounds(range)
  const search = filters.search.trim()

  const { data, error } = await supabase.rpc('get_product_performance_list', {
    p_from: fromIso,
    p_to_exclusive: toExclusiveIso,
    p_search: search || undefined,
    p_category_id: filters.categoryId ?? undefined,
    p_sort_by: filters.sortField,
    p_sort_desc: filters.sortDesc,
    p_limit: filters.pageSize,
    p_offset: (filters.page - 1) * filters.pageSize,
  })
  if (error) throw error

  const rows = data ?? []
  return {
    data: rows.map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      sku: row.sku,
      categoryId: row.category_id,
      categoryName: row.category_name,
      unit: row.unit,
      productStatus: row.product_status === 'archived' ? 'archived' : 'active',
      soldQuantity: row.sold_quantity,
      orderCount: row.order_count,
      revenue: row.revenue,
      cogs: row.cogs,
      grossProfit: row.gross_profit,
    })),
    total: rows[0]?.total_count ?? 0,
  }
}
