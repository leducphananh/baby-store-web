import { supabase } from '@/lib/supabase'
import type { ProductBatch, ProductInventorySummary } from '@/features/products/types/product'

export type ProductBatchesResult = {
  batches: ProductBatch[]
  summary: ProductInventorySummary
}

/**
 * Explicit shape of the select — the nested `import_receipt_items →
 * import_receipts` embed degrades supabase-js's generic inference, so this
 * is a narrow, documented boundary type (same approach as `get-products.ts`).
 */
type ProductBatchRow = {
  id: string
  lot_number: string | null
  manufacture_date: string | null
  expiration_date: string | null
  initial_quantity: number
  remaining_quantity: number
  purchase_price: number
  created_at: string | null
  import_receipt_items: {
    import_receipts: { id: string; receipt_number: string } | null
  } | null
}

const BATCH_COLUMNS =
  'id, lot_number, manufacture_date, expiration_date, initial_quantity, remaining_quantity, ' +
  'purchase_price, created_at, import_receipt_items(import_receipts(id, receipt_number))'

/**
 * All stock lots for a product, ordered First-Expired-First-Out (soonest
 * `expiration_date` first, NULLs last) — the same ordering stock allocation
 * will use (see `domain-driven-frontend` rule 3, `supabase-database` rule 6,
 * and `features/batches/utils/fefo.ts`). The summary is derived here so the
 * detail page never re-implements the aggregation. Each batch also carries
 * the import receipt it came from, for traceability.
 */
export async function getProductBatches(productId: string): Promise<ProductBatchesResult> {
  const { data, error } = await supabase
    .from('product_batches')
    .select(BATCH_COLUMNS)
    .eq('product_id', productId)
    .order('expiration_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .returns<ProductBatchRow[]>()

  if (error) throw error

  const batches: ProductBatch[] = (data ?? []).map((row) => {
    const sourceReceipt = row.import_receipt_items?.import_receipts ?? null
    return {
      id: row.id,
      lotNumber: row.lot_number,
      manufactureDate: row.manufacture_date,
      expirationDate: row.expiration_date,
      initialQuantity: row.initial_quantity,
      remainingQuantity: row.remaining_quantity,
      purchasePrice: row.purchase_price,
      createdAt: row.created_at,
      sourceReceiptId: sourceReceipt?.id ?? null,
      sourceReceiptNumber: sourceReceipt?.receipt_number ?? null,
    }
  })

  const withStock = batches.filter((batch) => batch.remainingQuantity > 0)
  const summary: ProductInventorySummary = {
    totalRemaining: batches.reduce((sum, batch) => sum + batch.remainingQuantity, 0),
    batchCount: withStock.length,
    nearestExpiration:
      withStock.find((batch) => batch.expirationDate !== null)?.expirationDate ?? null,
  }

  return { batches, summary }
}
