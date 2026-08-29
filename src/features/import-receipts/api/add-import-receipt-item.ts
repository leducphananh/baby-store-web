import { supabase } from '@/lib/supabase'
import type { ImportReceiptLineFormValues } from '@/features/import-receipts/schemas/import-receipt-line-schema'

export type AddImportReceiptItemInput = ImportReceiptLineFormValues & {
  receiptId: string
  productId: string
}

/**
 * Adds a line via `add_import_receipt_item` (see the Phase 4.2 migration) —
 * NOT a plain `.insert()`. The RPC atomically re-checks the receipt is
 * still `draft`, validates quantity/price/date invariants server-side, and
 * recomputes `import_receipts.total_cost` from the actual rows in the same
 * transaction, so the stored total is never derived from client
 * arithmetic (see `supabase-database`, `domain-driven-frontend`).
 */
export async function addImportReceiptItem(input: AddImportReceiptItemInput): Promise<{ id: string }> {
  const { data, error } = await supabase.rpc('add_import_receipt_item', {
    p_receipt_id: input.receiptId,
    p_product_id: input.productId,
    p_quantity: input.quantity,
    p_purchase_price: input.purchasePrice,
    p_lot_number: input.lotNumber.trim() ? input.lotNumber.trim() : undefined,
    p_manufacture_date: input.manufactureDate ? input.manufactureDate : undefined,
    p_expiration_date: input.expirationDate ? input.expirationDate : undefined,
  })
  if (error) throw error
  return { id: data }
}
