import { supabase } from '@/lib/supabase'
import type { ExpiryBucketRow } from '@/features/reports/types/expiry'

/**
 * Full expiry-distance distribution of ALL current remaining inventory
 * (see `get_expiry_bucket_summary()`'s migration comment) — reconciles
 * exactly with Phase 7.5's total inventory value/quantity. No horizon
 * parameter: this is the whole-inventory picture, unlike
 * `get_expiry_summary()`/`get_expiry_batch_list()` below.
 */
export async function getExpiryBucketSummary(): Promise<ExpiryBucketRow[]> {
  const { data, error } = await supabase.rpc('get_expiry_bucket_summary')
  if (error) throw error

  return (data ?? []).map((row) => ({
    bucket: row.bucket as ExpiryBucketRow['bucket'],
    bucketOrder: row.bucket_order,
    batchCount: row.batch_count,
    quantity: row.quantity,
    inventoryValue: row.inventory_value,
  }))
}
