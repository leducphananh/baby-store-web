/**
 * Domain model for `public.import_receipts` — the store's purchase/goods-in
 * documents. Derived from the generated `Database` types (see
 * `supabase-database`).
 *
 * Lifecycle (real DB `status` CHECK — do not invent values):
 *   draft      → editable header, not yet in stock, can be cancelled
 *   confirmed  → posted to inventory by `confirm_import_receipt()` (creates
 *                `product_batches` + `inventory_transactions`); immutable
 *                historical stock document
 *   cancelled  → a voided draft; read-only
 *
 * Stock posting (`confirmed`) is a separate step handled by a dedicated RPC
 * and is out of scope for this phase (see the Phase 4.1 report).
 */
export type ImportReceiptStatus = 'draft' | 'confirmed' | 'cancelled'

export type ImportReceipt = {
  id: string
  receiptNumber: string
  supplierId: string | null
  supplierName: string | null
  /** `import_date` — a `timestamptz`; treated as a calendar date in the UI. */
  importDate: string
  notes: string | null
  status: ImportReceiptStatus
  /** Recorded total cost (integer VND). Maintained with line entry in a later phase. */
  totalCost: number
  createdById: string | null
  createdByName: string | null
  itemCount: number
  createdAt: string | null
  updatedAt: string | null
  confirmedAt: string | null
}

/** A read-only line of an import receipt (`public.import_receipt_items`). */
export type ImportReceiptLine = {
  id: string
  productId: string | null
  productName: string | null
  productSku: string | null
  productUnit: string | null
  quantity: number
  purchasePrice: number
  lotNumber: string | null
  manufactureDate: string | null
  expirationDate: string | null
  /** `quantity * purchase_price`, integer VND. */
  lineTotal: number
}

export type ImportReceiptSortField = 'import_date' | 'receipt_number' | 'created_at'

export type ImportReceiptStatusFilter = 'all' | ImportReceiptStatus

export type ImportReceiptFilters = {
  /** Matches `receipt_number`. */
  search: string
  supplierId: string | null
  status: ImportReceiptStatusFilter
  /** Inclusive `YYYY-MM-DD` bounds on `import_date`; `null` = unbounded. */
  fromDate: string | null
  toDate: string | null
  page: number
  pageSize: number
  sortField: ImportReceiptSortField
  sortDesc: boolean
}
