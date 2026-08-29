/**
 * FEFO — First-Expired-First-Out — ordering.
 *
 * This module is the **single definition of the rule** by which stock is
 * consumed (`domain-driven-frontend` rule 3, `supabase-database` rule 6).
 * Order fulfilment is a later phase; when it lands, `allocateStockFefo` must
 * walk batches in exactly this order rather than re-deriving its own. Until
 * then this is used to keep every batch *list view* in consumption order, so
 * what staff see on the product / receipt pages already reflects the order
 * stock will actually leave.
 *
 * The batch list queries also apply this ordering in SQL
 * (`.order('expiration_date', asc, nullsFirst:false).order('created_at', asc)`)
 * so pagination is stable; this comparator is the same rule for any
 * client-side sorting/merging.
 */

/** The minimal batch shape FEFO ordering needs. */
export type FefoBatch = {
  /** Plain `YYYY-MM-DD`, or `null` when the lot has no tracked expiry. */
  expirationDate: string | null
  /** Timestamp string; deterministic tie-breaker. */
  createdAt: string | null
  remainingQuantity: number
}

/**
 * Compare two batches for FEFO order:
 *  1. soonest real `expirationDate` first
 *  2. batches with no `expirationDate` come last (they can't drive an
 *     expiry decision, so they're consumed only once dated stock is gone)
 *  3. older `createdAt` first as a stable tie-breaker
 */
export function compareBatchesFefo(a: FefoBatch, b: FefoBatch): number {
  if (a.expirationDate !== b.expirationDate) {
    if (a.expirationDate === null) return 1
    if (b.expirationDate === null) return -1
    return a.expirationDate < b.expirationDate ? -1 : 1
  }
  const aCreated = a.createdAt ?? ''
  const bCreated = b.createdAt ?? ''
  if (aCreated === bCreated) return 0
  return aCreated < bCreated ? -1 : 1
}

/** A copy of `batches` in FEFO consumption order (does not mutate the input). */
export function orderBatchesFefo<T extends FefoBatch>(batches: readonly T[]): T[] {
  return [...batches].sort(compareBatchesFefo)
}

/**
 * Batches that still hold stock, in FEFO consumption order — the candidate
 * set a future `allocateStockFefo` will draw from. Provided now so the data
 * shape and ordering are settled before allocation is built; this does NOT
 * perform any allocation.
 */
export function allocatableBatchesFefo<T extends FefoBatch>(batches: readonly T[]): T[] {
  return orderBatchesFefo(batches.filter((batch) => batch.remainingQuantity > 0))
}
