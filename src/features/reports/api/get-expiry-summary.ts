import { supabase } from '@/lib/supabase'
import type { ExpiryHorizonDays, ExpirySummary } from '@/features/reports/types/expiry'

/**
 * Horizon-scoped expiry-risk KPIs (see `get_expiry_summary()`'s migration
 * comment) — `horizonDays` is a report filter the caller chooses, never a
 * permanent business threshold baked into the query.
 */
export async function getExpirySummary(horizonDays: ExpiryHorizonDays): Promise<ExpirySummary> {
  const { data, error } = await supabase.rpc('get_expiry_summary', { p_horizon_days: horizonDays })
  if (error) throw error

  const row = data?.[0]
  return {
    expiredBatchCount: row?.expired_batch_count ?? 0,
    expiredQuantity: row?.expired_quantity ?? 0,
    expiredInventoryValue: row?.expired_inventory_value ?? 0,
    nearExpiryBatchCount: row?.near_expiry_batch_count ?? 0,
    nearExpiryQuantity: row?.near_expiry_quantity ?? 0,
    nearExpiryInventoryValue: row?.near_expiry_inventory_value ?? 0,
    missingExpiryBatchCount: row?.missing_expiry_batch_count ?? 0,
    missingExpiryQuantity: row?.missing_expiry_quantity ?? 0,
    missingExpiryValue: row?.missing_expiry_value ?? 0,
  }
}
