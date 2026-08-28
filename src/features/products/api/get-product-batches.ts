import { supabase } from '@/lib/supabase'
import type { ProductBatch, ProductInventorySummary } from '@/features/products/types/product'

export type ProductBatchesResult = {
  batches: ProductBatch[]
  summary: ProductInventorySummary
}

/**
 * All stock lots for a product, ordered First-Expired-First-Out (soonest
 * `expiration_date` first, NULLs last) — the same ordering stock allocation
 * will use (see `domain-driven-frontend` rule 3, `supabase-database` rule 6).
 * The summary is derived here so the detail page never re-implements the
 * aggregation.
 */
export async function getProductBatches(productId: string): Promise<ProductBatchesResult> {
  const { data, error } = await supabase
    .from('product_batches')
    .select(
      'id, lot_number, manufacture_date, expiration_date, initial_quantity, remaining_quantity, purchase_price, created_at',
    )
    .eq('product_id', productId)
    .order('expiration_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) throw error

  const batches: ProductBatch[] = (data ?? []).map((row) => ({
    id: row.id,
    lotNumber: row.lot_number,
    manufactureDate: row.manufacture_date,
    expirationDate: row.expiration_date,
    initialQuantity: row.initial_quantity,
    remainingQuantity: row.remaining_quantity,
    purchasePrice: row.purchase_price,
    createdAt: row.created_at,
  }))

  const withStock = batches.filter((batch) => batch.remainingQuantity > 0)
  const summary: ProductInventorySummary = {
    totalRemaining: batches.reduce((sum, batch) => sum + batch.remainingQuantity, 0),
    batchCount: withStock.length,
    nearestExpiration:
      withStock.find((batch) => batch.expirationDate !== null)?.expirationDate ?? null,
  }

  return { batches, summary }
}
