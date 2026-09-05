import { supabase } from '@/lib/supabase'
import type { InventoryReportFilters, InventoryReportPage } from '@/features/reports/types/inventory'

function toStockStatus(value: string | null): 'out_of_stock' | 'low_stock' | 'normal' {
  if (value === 'out_of_stock' || value === 'low_stock') return value
  return 'normal'
}

/**
 * Paginated, sorted, filtered current inventory + valuation per product —
 * search, category/stock-status filter, sorting, and pagination all run
 * inside `get_inventory_product_list()` in Postgres (see its migration
 * comment), never fetched in full and sliced/sorted in the browser.
 */
export async function getInventoryProductList(filters: InventoryReportFilters): Promise<InventoryReportPage> {
  const search = filters.search.trim()

  const { data, error } = await supabase.rpc('get_inventory_product_list', {
    p_search: search || undefined,
    p_category_id: filters.categoryId ?? undefined,
    p_stock_status: filters.stockStatus === 'all' ? undefined : filters.stockStatus,
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
      batchCount: row.batch_count,
      inventoryValue: row.inventory_value,
      averageCost: row.average_cost,
      minimumStock: row.minimum_stock,
      stockStatus: toStockStatus(row.stock_status),
      nearestExpiration: row.nearest_expiration,
    })),
    total: rows[0]?.total_count ?? 0,
  }
}
