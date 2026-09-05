import { supabase } from '@/lib/supabase'
import type { InventoryAlertCondition, InventoryAlertType } from '@/features/reports/types/inventory'

/**
 * Current out_of_stock/low_stock alert occurrence data (Phase 8.2) —
 * grouped from `product_inventory_overview.stock_status` (Phase 7.5
 * authoritative semantics, never recomputed client-side). Replaces
 * `getInventoryValueSummary()` as the header Bell/Alert Center's source
 * for these two alert types specifically: it's lighter (no valuation join)
 * and, unlike a plain count, carries a fingerprint that already reflects
 * the affected product-id set and occurrence lifecycle (see the RPC's
 * migration comment) — nothing here recomputes that fingerprint.
 *
 * Side effect on the database: this RPC upserts `alert_condition_states`
 * every time it's called, to track occurrence lifecycle. That's the RPC's
 * concern, not something this function or its callers need to reason
 * about beyond "don't call it more often than an alert surface actually
 * needs current data" (React Query's `staleTime` already handles that).
 */
export async function getInventoryAlertConditions(): Promise<InventoryAlertCondition[]> {
  const { data, error } = await supabase.rpc('get_inventory_alert_conditions')
  if (error) throw error

  return (data ?? []).map((row) => ({
    alertType: row.alert_type as InventoryAlertType,
    affectedCount: row.affected_count ?? 0,
    fingerprint: row.fingerprint,
    sampleProductNames: row.sample_product_names ?? [],
  }))
}
