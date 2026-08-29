/**
 * Domain types for `public.product_batches` — the store's stock lots.
 *
 * A batch is the unit that carries manufacture/expiry dates and links back
 * to the `import_receipt_items` row it was created from
 * (`import_item_id`, unique, `ON DELETE RESTRICT`), so every unit of stock
 * is traceable to its purchase (see `domain-driven-frontend` rule 2).
 * Batches are created by the `confirm_import_receipt()` RPC, not by direct
 * insert from the client.
 *
 * `initial_quantity` / `remaining_quantity` are integer counts of the
 * product's base selling unit, both with a DB `CHECK (>= 0)`. Expiry is
 * never before manufacture — enforced by Zod, the import-item RPCs, and (as
 * of Phase 4.4) a table `CHECK` constraint on both
 * `import_receipt_items` and `product_batches`.
 */

/**
 * Classified expiry state of a batch, derived from its `expiration_date`
 * relative to today by the single shared helper `classifyExpiry`
 * (`features/batches/utils/expiry.ts`). A discriminated union rather than a
 * bare enum so the days-remaining / days-ago number travels with the state
 * (see `typescript-strict`, `domain-driven-frontend` rule 19).
 */
export type BatchExpiryStatus =
  | { kind: 'none' }
  | { kind: 'expired'; daysAgo: number }
  | { kind: 'expiring-soon'; daysRemaining: number }
  | { kind: 'safe'; daysRemaining: number }

/**
 * A stock lot listed in the context of the import receipt that produced it
 * (the "batches by receipt" view). Product identity is joined in; the source
 * receipt is implicit (it's the page you're on).
 */
export type ReceiptBatch = {
  id: string
  productId: string | null
  productName: string | null
  productSku: string | null
  productUnit: string | null
  lotNumber: string | null
  manufactureDate: string | null
  expirationDate: string | null
  initialQuantity: number
  remainingQuantity: number
  /** Integer VND unit cost captured from the import line. */
  purchasePrice: number
  /** The `import_receipt_items` row this batch was created from. */
  importItemId: string | null
  createdAt: string | null
}
