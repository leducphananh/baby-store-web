import { supabase } from '@/lib/supabase'
import { PURCHASE_INVOICES_BUCKET } from '@/features/purchase-invoices/api/get-purchase-invoices'
import { InvoiceFileRejectedError } from '@/features/purchase-invoices/api/purchase-invoice-errors'
import { validateInvoiceFile } from '@/features/purchase-invoices/utils/validate-invoice-file'

/** Keep the user's original name for display/download, but only the basename and capped. */
function safeDisplayName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name
  return base.slice(0, 200)
}

/**
 * Upload one attachment for a purchase invoice and record it in
 * `purchase_invoice_files` — one logical operation (see `file-upload`
 * rule 7).
 *
 * Order and failure handling mirror `uploadProductImage`:
 *  1. validate (sniff bytes, not extension) → reject early, no network call
 *  2. upload the object under a random, entity-scoped key
 *     (`{importReceiptId}/{invoiceId}/{uuid}.{ext}`) — never the user's
 *     filename (collision / path-traversal risk, `supabase-storage` rule 9)
 *  3. insert the DB row; **if that fails, delete the just-uploaded object**
 *     so a failed insert can't leave an orphan file in a private bucket
 */
export async function uploadPurchaseInvoiceFile({
  purchaseInvoiceId,
  importReceiptId,
  file,
  createdBy,
}: {
  purchaseInvoiceId: string
  importReceiptId: string
  file: File
  createdBy: string | null
}): Promise<void> {
  const validation = await validateInvoiceFile(file)
  if (!validation.ok) {
    throw new InvoiceFileRejectedError(validation.message)
  }

  const path = `${importReceiptId}/${purchaseInvoiceId}/${crypto.randomUUID()}.${validation.ext}`

  const { error: uploadError } = await supabase.storage
    .from(PURCHASE_INVOICES_BUCKET)
    .upload(path, file, { contentType: validation.contentType, upsert: false })
  if (uploadError) throw uploadError

  const { error: insertError } = await supabase.from('purchase_invoice_files').insert({
    purchase_invoice_id: purchaseInvoiceId,
    storage_path: path,
    file_name: safeDisplayName(file.name),
    mime_type: validation.contentType,
    file_size: file.size,
    created_by: createdBy,
  })

  if (insertError) {
    // Roll back the upload so we don't leak an untracked file.
    await removeQuietly(path)
    throw insertError
  }
}

/** Best-effort cleanup; never masks the original error that triggered it. */
async function removeQuietly(path: string): Promise<void> {
  try {
    await supabase.storage.from(PURCHASE_INVOICES_BUCKET).remove([path])
  } catch {
    // Swallowed on purpose: the caller is already throwing the real cause,
    // and a leftover object here is unreachable from the UI and can be
    // reaped later.
  }
}
