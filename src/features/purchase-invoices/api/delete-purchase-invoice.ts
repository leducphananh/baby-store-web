import { supabase } from '@/lib/supabase'
import { PURCHASE_INVOICES_BUCKET } from '@/features/purchase-invoices/api/get-purchase-invoices'

/**
 * Delete one purchase invoice and every attachment it owns.
 *
 * Order matters (see `file-upload` rule 8, `supabase-storage` rule 8):
 *  1. read the attachment object keys
 *  2. remove those objects from Storage — if this fails, **abort** and keep
 *     the invoice row, rather than deleting the row and orphaning private
 *     files
 *  3. delete the invoice row; `purchase_invoice_files` rows are removed by
 *     the `ON DELETE CASCADE` FK, so no separate row cleanup is needed
 *
 * The only window left is "objects gone, row delete then fails" — the next
 * attempt re-runs cleanly (removing already-absent objects is a no-op).
 */
export async function deletePurchaseInvoice(invoiceId: string): Promise<void> {
  const { data: files, error: filesError } = await supabase
    .from('purchase_invoice_files')
    .select('storage_path')
    .eq('purchase_invoice_id', invoiceId)

  if (filesError) throw filesError

  const paths = (files ?? []).map((file) => file.storage_path)
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(PURCHASE_INVOICES_BUCKET)
      .remove(paths)
    if (storageError) throw storageError
  }

  const { error: rowError } = await supabase.from('purchase_invoices').delete().eq('id', invoiceId)
  if (rowError) throw rowError
}
