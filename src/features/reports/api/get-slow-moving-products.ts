import { supabase } from '@/lib/supabase'
import type { SlowMovingFilters, SlowMovingPage } from '@/features/reports/types/expiry'

/**
 * Paginated, sorted, filtered factual current-inventory + recent-sales
 * metrics (see `get_slow_moving_products()`'s migration comment) — no
 * invented "slow-moving" classification anywhere in this mapping.
 */
export async function getSlowMovingProducts(filters: SlowMovingFilters): Promise<SlowMovingPage> {
  const search = filters.search.trim()

  const { data, error } = await supabase.rpc('get_slow_moving_products', {
    p_lookback_days: filters.lookbackDays,
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
      currentQuantity: row.current_quantity,
      inventoryValue: row.inventory_value,
      lastSoldAt: row.last_sold_at,
      daysSinceLastSale: row.days_since_last_sale,
      soldQuantityLookback: row.sold_quantity_lookback,
      orderCountLookback: row.order_count_lookback,
      revenueLookback: row.revenue_lookback,
    })),
    total: rows[0]?.total_count ?? 0,
  }
}
