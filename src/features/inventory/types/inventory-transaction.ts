/**
 * Domain model for `public.inventory_transactions` — the append-only ledger
 * of every stock movement in the store (see `domain-driven-frontend` rule 4,
 * `supabase-database` rule 8). "Current stock" is derived from this ledger
 * (and the mirrored `product_batches.remaining_quantity`), never the other
 * way round.
 *
 * Rows are written **only** by trusted SECURITY DEFINER RPCs
 * (`confirm_import_receipt`, `complete_order`, `cancel_order`,
 * `adjust_inventory`); the client reads them and never mutates them. RLS on
 * the table has no UPDATE or DELETE policy, so history cannot be rewritten
 * from the app — a correction is always a *new* transaction.
 */

/** Real `type` CHECK values on the column — do not invent others. */
export const INVENTORY_TRANSACTION_TYPES = [
  'IMPORT',
  'SALE',
  'ORDER_CANCEL',
  'MANUAL_ADJUSTMENT',
  'RETURN',
  'DAMAGE',
  'EXPIRED',
] as const

export type InventoryTransactionType = (typeof INVENTORY_TRANSACTION_TYPES)[number]

/** Real `reference_type` CHECK values — what kind of document the row points at. */
export type InventoryReferenceType = 'order' | 'import' | 'adjustment'

export type InventoryTransaction = {
  id: string
  /** `created_at` — a genuine `timestamptz`; shown in local time. */
  createdAt: string | null
  productId: string | null
  productName: string | null
  productSku: string | null
  productUnit: string | null
  batchId: string | null
  batchLotNumber: string | null
  batchExpirationDate: string | null
  type: InventoryTransactionType
  /**
   * Signed delta in the product's base unit: positive adds stock (import,
   * order-cancel restock, positive adjustment), negative removes it (sale,
   * damage, expiry write-off, negative adjustment).
   */
  quantity: number
  referenceType: InventoryReferenceType
  referenceId: string | null
  /** Human document id for the reference (`receipt_number` / `order_number`), if resolvable. */
  referenceLabel: string | null
  note: string | null
  createdById: string | null
  createdByName: string | null
}

export type InventoryTransactionTypeFilter = 'all' | InventoryTransactionType

export type InventoryTransactionFilters = {
  /** `null` = every product. */
  productId: string | null
  /** `null` = every batch; only meaningful together with `productId`. */
  batchId: string | null
  type: InventoryTransactionTypeFilter
  /** Inclusive `YYYY-MM-DD` bounds on `created_at`; `null` = unbounded. */
  fromDate: string | null
  toDate: string | null
  page: number
  pageSize: number
}

export type InventoryTransactionsPage = {
  data: InventoryTransaction[]
  total: number
}
