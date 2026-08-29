import { supabase } from '@/lib/supabase'
import type { PurchaseInvoiceFormValues } from '@/features/purchase-invoices/schemas/purchase-invoice-schema'

/**
 * Update a purchase invoice's header fields (number, date, notes). Unlike an
 * import receipt, a purchase invoice is not a posted stock document, so
 * there is no `draft`-only guard — the store may correct a mistyped invoice
 * number or date at any time.
 */
export async function updatePurchaseInvoice({
  id,
  values,
}: {
  id: string
  values: PurchaseInvoiceFormValues
}): Promise<void> {
  const { error } = await supabase
    .from('purchase_invoices')
    .update({
      invoice_number: values.invoiceNumber.trim(),
      invoice_date: values.invoiceDate,
      notes: values.notes.trim() ? values.notes.trim() : null,
    })
    .eq('id', id)

  if (error) throw error
}
