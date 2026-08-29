import { supabase } from '@/lib/supabase'
import type {
  PurchaseInvoice,
  PurchaseInvoiceFile,
} from '@/features/purchase-invoices/types/purchase-invoice'

export const PURCHASE_INVOICES_BUCKET = 'purchase-invoices'
const SIGNED_URL_TTL_SECONDS = 60 * 60

type PurchaseInvoiceFileRow = {
  id: string
  purchase_invoice_id: string
  storage_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  created_at: string | null
}

type PurchaseInvoiceRow = {
  id: string
  import_receipt_id: string
  invoice_number: string
  invoice_date: string
  notes: string | null
  created_by: string | null
  created_at: string | null
  profiles: { full_name: string | null } | null
  purchase_invoice_files: PurchaseInvoiceFileRow[]
}

const LIST_COLUMNS =
  'id, import_receipt_id, invoice_number, invoice_date, notes, created_by, created_at, ' +
  'profiles!purchase_invoices_created_by_fkey(full_name), ' +
  'purchase_invoice_files(id, purchase_invoice_id, storage_path, file_name, mime_type, file_size, created_at)'

/**
 * All purchase invoices for one import receipt, each with its attachments.
 * Attachment URLs are short-lived signed URLs — the `purchase-invoices`
 * bucket is private (sensitive supplier pricing / tax data, see
 * `supabase-storage` rule 6). A file whose object can't be signed (e.g. it
 * went missing) is dropped from the result rather than rendering a broken
 * "open" link — the same precedent as `getProductImages`.
 *
 * Newest invoice first; within an invoice, oldest attachment first. One
 * round trip for the rows, one for the batch of signed URLs.
 */
export async function getPurchaseInvoices(importReceiptId: string): Promise<PurchaseInvoice[]> {
  const { data, error } = await supabase
    .from('purchase_invoices')
    .select(LIST_COLUMNS)
    .eq('import_receipt_id', importReceiptId)
    .order('invoice_date', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<PurchaseInvoiceRow[]>()

  if (error) throw error

  const rows = data ?? []
  if (rows.length === 0) return []

  const allPaths = rows.flatMap((row) =>
    row.purchase_invoice_files.map((file) => file.storage_path),
  )

  const urlByPath = new Map<string, string>()
  if (allPaths.length > 0) {
    const { data: signed, error: signError } = await supabase.storage
      .from(PURCHASE_INVOICES_BUCKET)
      .createSignedUrls(allPaths, SIGNED_URL_TTL_SECONDS)
    if (signError) throw signError

    for (const item of signed ?? []) {
      if (item.signedUrl && item.path) urlByPath.set(item.path, item.signedUrl)
    }
  }

  return rows.map((row): PurchaseInvoice => {
    const files = [...row.purchase_invoice_files]
      .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
      .map((file): PurchaseInvoiceFile | null => {
        const url = urlByPath.get(file.storage_path)
        if (!url) return null
        return {
          id: file.id,
          purchaseInvoiceId: file.purchase_invoice_id,
          storagePath: file.storage_path,
          fileName: file.file_name,
          mimeType: file.mime_type,
          fileSize: file.file_size,
          createdAt: file.created_at,
          url,
        }
      })
      .filter((file): file is PurchaseInvoiceFile => file !== null)

    return {
      id: row.id,
      importReceiptId: row.import_receipt_id,
      invoiceNumber: row.invoice_number,
      invoiceDate: row.invoice_date,
      notes: row.notes,
      createdById: row.created_by,
      createdByName: row.profiles?.full_name ?? null,
      createdAt: row.created_at,
      files,
    }
  })
}

/**
 * A fresh signed URL that forces a download (Content-Disposition:
 * attachment) with the original filename. Generated on demand — the
 * view/open URLs from `getPurchaseInvoices` open inline instead.
 */
export async function getInvoiceFileDownloadUrl(file: {
  storagePath: string
  fileName: string
}): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PURCHASE_INVOICES_BUCKET)
    .createSignedUrl(file.storagePath, 60, { download: file.fileName })

  if (error) throw error
  if (!data) throw new Error('Không tạo được liên kết tải xuống.')
  return data.signedUrl
}
