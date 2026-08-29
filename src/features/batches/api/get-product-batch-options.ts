import { supabase } from '@/lib/supabase'

/** A single lot as a pick option (batch filter, later order line entry). */
export type BatchOption = {
  id: string
  lotNumber: string | null
  expirationDate: string | null
}

/**
 * Lean lot list for one product — id + lot + expiry only, ordered
 * First-Expired-First-Out (see `features/batches/utils/fefo.ts`). Distinct
 * from `getProductBatches`, which also aggregates stock and joins the import
 * source for the detail view.
 */
export async function getProductBatchOptions(productId: string): Promise<BatchOption[]> {
  const { data, error } = await supabase
    .from('product_batches')
    .select('id, lot_number, expiration_date, created_at')
    .eq('product_id', productId)
    .order('expiration_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    lotNumber: row.lot_number,
    expirationDate: row.expiration_date,
  }))
}
