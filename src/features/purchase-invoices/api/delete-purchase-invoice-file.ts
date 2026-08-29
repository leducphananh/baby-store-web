import { supabase } from '@/lib/supabase'
import { PURCHASE_INVOICES_BUCKET } from '@/features/purchase-invoices/api/get-purchase-invoices'
import type { PurchaseInvoiceFile } from '@/features/purchase-invoices/types/purchase-invoice'

/**
 * Remove one attachment — storage object first, then the DB row.
 *
 * Order matters (see `file-upload` rule 7): if the storage delete fails we
 * **keep** the DB row and abort, rather than deleting the row and leaving an
 * untracked file in a private bucket. The reverse (row gone, object briefly
 * remains) is only reached once storage already succeeded, and is
 * self-correcting.
 */
export async function deletePurchaseInvoiceFile(
  file: Pick<PurchaseInvoiceFile, 'id' | 'storagePath'>,
): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(PURCHASE_INVOICES_BUCKET)
    .remove([file.storagePath])
  if (storageError) throw storageError

  const { error: rowError } = await supabase
    .from('purchase_invoice_files')
    .delete()
    .eq('id', file.id)
  if (rowError) throw rowError
}
