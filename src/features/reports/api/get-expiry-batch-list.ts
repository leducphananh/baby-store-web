import { supabase } from '@/lib/supabase'
import type { ExpiryBatchFilters, ExpiryBatchPage } from '@/features/reports/types/expiry'

/**
 * Paginated, sorted, filtered batch-level expiry-risk detail (see
 * `get_expiry_batch_list()`'s migration comment) — expired ∪
 * near-expiry-within-horizon ∪ missing-expiry only, never every long-dated
 * "safe" batch.
 */
export async function getExpiryBatchList(filters: ExpiryBatchFilters): Promise<ExpiryBatchPage> {
  const search = filters.search.trim()

  const { data, error } = await supabase.rpc('get_expiry_batch_list', {
    p_horizon_days: filters.horizonDays,
    p_search: search || undefined,
    p_category_id: filters.categoryId ?? undefined,
    p_status_filter: filters.statusFilter,
    p_sort_by: filters.sortField,
    p_sort_desc: filters.sortDesc,
    p_limit: filters.pageSize,
    p_offset: (filters.page - 1) * filters.pageSize,
  })
  if (error) throw error

  const rows = data ?? []
  return {
    data: rows.map((row) => ({
      batchId: row.batch_id,
      productId: row.product_id,
      productName: row.product_name,
      sku: row.sku,
      categoryId: row.category_id,
      categoryName: row.category_name,
      productStatus: row.product_status === 'archived' ? 'archived' : 'active',
      lotNumber: row.lot_number,
      remainingQuantity: row.remaining_quantity,
      purchasePrice: row.purchase_price,
      inventoryValue: row.inventory_value,
      expirationDate: row.expiration_date,
      daysRemaining: row.days_remaining,
      expiryStatus: row.expiry_status as 'expired' | 'near_expiry' | 'missing_expiry',
    })),
    total: rows[0]?.total_count ?? 0,
  }
}
