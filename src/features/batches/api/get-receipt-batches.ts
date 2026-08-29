import { supabase } from '@/lib/supabase'
import { orderBatchesFefo } from '@/features/batches/utils/fefo'
import type { ReceiptBatch } from '@/features/batches/types/batch'

/**
 * Explicit shape of the select — the two embedded relations degrade
 * supabase-js's generic inference, so this is a narrow documented boundary
 * type, not an `any` (same approach as `get-products.ts`).
 */
type ReceiptBatchRow = {
  id: string
  product_id: string | null
  lot_number: string | null
  manufacture_date: string | null
  expiration_date: string | null
  initial_quantity: number
  remaining_quantity: number
  purchase_price: number
  import_item_id: string | null
  created_at: string | null
  products: { name: string; sku: string; unit: string } | null
  // Present only to drive the `!inner` filter below; never read.
  import_receipt_items: { import_receipt_id: string } | null
}

const COLUMNS =
  'id, product_id, lot_number, manufacture_date, expiration_date, initial_quantity, ' +
  'remaining_quantity, purchase_price, import_item_id, created_at, ' +
  'products(name, sku, unit), import_receipt_items!inner(import_receipt_id)'

/**
 * All stock lots created from one import receipt's lines ("batches by
 * receipt" view). Joined via `product_batches.import_item_id →
 * import_receipt_items.import_receipt_id`, which is how a batch stays
 * traceable to its purchase source (`domain-driven-frontend` rule 2).
 *
 * A `draft` or `cancelled` receipt has no batches yet — they are created
 * only when `confirm_import_receipt()` runs — so an empty result is normal,
 * not an error.
 *
 * Ordered First-Expired-First-Out, the order stock will actually be consumed
 * in (see `features/batches/utils/fefo.ts`).
 */
export async function getReceiptBatches(receiptId: string): Promise<ReceiptBatch[]> {
  const { data, error } = await supabase
    .from('product_batches')
    .select(COLUMNS)
    .eq('import_receipt_items.import_receipt_id', receiptId)
    .order('expiration_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .returns<ReceiptBatchRow[]>()

  if (error) throw error

  const batches: ReceiptBatch[] = (data ?? []).map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.products?.name ?? null,
    productSku: row.products?.sku ?? null,
    productUnit: row.products?.unit ?? null,
    lotNumber: row.lot_number,
    manufactureDate: row.manufacture_date,
    expirationDate: row.expiration_date,
    initialQuantity: row.initial_quantity,
    remainingQuantity: row.remaining_quantity,
    purchasePrice: row.purchase_price,
    importItemId: row.import_item_id,
    createdAt: row.created_at,
  }))

  // Re-assert FEFO client-side too: the single source of the ordering rule,
  // independent of the SQL `order by`.
  return orderBatchesFefo(batches)
}
