import { supabase } from '@/lib/supabase'
import type { ImportReceiptLineFormValues } from '@/features/import-receipts/schemas/import-receipt-line-schema'

export type UpdateImportReceiptItemInput = ImportReceiptLineFormValues & { itemId: string }

/** Via `update_import_receipt_item` — same atomicity/authoritative-total rationale as add. */
export async function updateImportReceiptItem(input: UpdateImportReceiptItemInput): Promise<void> {
  const { error } = await supabase.rpc('update_import_receipt_item', {
    p_item_id: input.itemId,
    p_quantity: input.quantity,
    p_purchase_price: input.purchasePrice,
    p_lot_number: input.lotNumber.trim() ? input.lotNumber.trim() : undefined,
    p_manufacture_date: input.manufactureDate ? input.manufactureDate : undefined,
    p_expiration_date: input.expirationDate ? input.expirationDate : undefined,
  })
  if (error) throw error
}
