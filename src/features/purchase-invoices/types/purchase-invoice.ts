/**
 * Domain model for `public.purchase_invoices` + `public.purchase_invoice_files`
 * — the purchase VAT / red-invoice (hóa đơn đỏ / hóa đơn GTGT) documents the
 * store receives from suppliers for imported goods. Derived from the generated
 * `Database` types (see `supabase-database`).
 *
 * A purchase invoice always belongs to one import receipt
 * (`import_receipt_id`, `ON DELETE CASCADE`). The supplier and its tax code
 * are NOT stored on the invoice row — they are read from the parent import
 * receipt's supplier, so there is one source of truth for who the goods came
 * from (see `domain-driven-frontend`).
 *
 * Schema note: `purchase_invoices` currently has no monetary tax columns
 * (pre-tax amount, VAT rate, VAT amount, invoice total). Only the invoice
 * number, invoice date and free-text notes are captured. Adding tax-amount
 * columns is a schema change to be decided separately (CLAUDE.md §10), not
 * something this phase invents a frontend-only shape for.
 */
export type PurchaseInvoice = {
  id: string
  importReceiptId: string
  invoiceNumber: string
  /** `invoice_date` — a Postgres `date`, i.e. a plain `YYYY-MM-DD` string. */
  invoiceDate: string
  notes: string | null
  createdById: string | null
  createdByName: string | null
  createdAt: string | null
  files: PurchaseInvoiceFile[]
}

/** One uploaded attachment for a purchase invoice (`purchase_invoice_files`). */
export type PurchaseInvoiceFile = {
  id: string
  purchaseInvoiceId: string
  /** Object key inside the private `purchase-invoices` bucket — needed to delete it. */
  storagePath: string
  fileName: string
  mimeType: string | null
  fileSize: number | null
  createdAt: string | null
  /** Short-lived signed URL for viewing; regenerated on each fetch. */
  url: string
}
