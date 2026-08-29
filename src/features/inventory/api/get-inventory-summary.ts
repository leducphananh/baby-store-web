import { supabase } from '@/lib/supabase'
import type { InventoryOverviewSummary } from '@/features/inventory/types/inventory-overview'

const VIEW = 'product_inventory_overview'

/**
 * Global counts for the dashboard's alert cards: one `head: true` count
 * query per status (returns a count, no rows), run in parallel — four fixed
 * round trips regardless of catalog size, never a full-table download
 * (`dashboard-ui` rule 7a, `frontend-performance`). Independent of the
 * table's current filters by design (see `InventoryOverviewSummary`'s doc
 * comment).
 */
export async function getInventorySummary(): Promise<InventoryOverviewSummary> {
  const [outOfStock, lowStock, expiringSoon, expired] = await Promise.all([
    countWhere('stock_status', 'out_of_stock'),
    countWhere('stock_status', 'low_stock'),
    countWhere('expiry_status', 'expiring_soon'),
    countWhere('expiry_status', 'expired'),
  ])

  return { outOfStock, lowStock, expiringSoon, expired }
}

async function countWhere(column: 'stock_status' | 'expiry_status', value: string): Promise<number> {
  const { count, error } = await supabase
    .from(VIEW)
    .select('product_id', { count: 'exact', head: true })
    .eq(column, value)

  if (error) throw error
  return count ?? 0
}
