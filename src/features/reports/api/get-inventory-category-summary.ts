import { supabase } from '@/lib/supabase'
import type { InventoryCategoryRow } from '@/features/reports/types/inventory'

/**
 * Category-level current inventory valuation — a product with no category
 * groups under one `categoryId: null` row, never dropped ("Chưa phân
 * loại", requirement §32/§38).
 */
export async function getInventoryCategorySummary(): Promise<InventoryCategoryRow[]> {
  const { data, error } = await supabase.rpc('get_inventory_category_summary')
  if (error) throw error

  return (data ?? []).map((row) => ({
    categoryId: row.category_id,
    categoryName: row.category_name,
    productCount: row.product_count,
    totalQuantity: row.total_quantity,
    inventoryValue: row.inventory_value,
  }))
}
