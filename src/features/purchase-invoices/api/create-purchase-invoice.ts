import { supabase } from '@/lib/supabase'
import type { PurchaseInvoiceFormValues } from '@/features/purchase-invoices/schemas/purchase-invoice-schema'

export type CreatePurchaseInvoiceInput = PurchaseInvoiceFormValues & {
  importReceiptId: string
  /** Current user's id for `created_by`; `null` if somehow unavailable. */
  createdBy: string | null
}

/**
 * Create one purchase VAT / red invoice linked to an import receipt. A
 * single-row insert (attachments are uploaded separately, one logical
 * operation each — see `upload-purchase-invoice-file.ts`), so no atomicity
 * concern here.
 *
 * `invoiceDate` is a `YYYY-MM-DD` string stored verbatim into the `date`
 * column — no timezone conversion (see `@/utils/date`).
 */
export async function createPurchaseInvoice(
  input: CreatePurchaseInvoiceInput,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('purchase_invoices')
    .insert({
      import_receipt_id: input.importReceiptId,
      invoice_number: input.invoiceNumber.trim(),
      invoice_date: input.invoiceDate,
      notes: input.notes.trim() ? input.notes.trim() : null,
      created_by: input.createdBy,
    })
    .select('id')
    .single()

  if (error) throw error
  return { id: data.id }
}
