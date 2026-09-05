import { supabase } from '@/lib/supabase'
import type { InventoryValueSummary } from '@/features/reports/types/inventory'

/**
 * Current inventory valuation KPIs — a snapshot, no date range (see
 * `get_inventory_value_summary()`'s migration comment). Never fetched as
 * raw batches and reduced client-side.
 */
export async function getInventoryValueSummary(): Promise<InventoryValueSummary> {
  const { data, error } = await supabase.rpc('get_inventory_value_summary')
  if (error) throw error

  const row = data?.[0]
  return {
    productsInStockCount: row?.products_in_stock_count ?? 0,
    totalUnits: row?.total_units ?? 0,
    totalInventoryValue: row?.total_inventory_value ?? 0,
    lowStockCount: row?.low_stock_count ?? 0,
    outOfStockCount: row?.out_of_stock_count ?? 0,
    orphanBatchCount: row?.orphan_batch_count ?? 0,
    orphanBatchValue: row?.orphan_batch_value ?? 0,
  }
}
