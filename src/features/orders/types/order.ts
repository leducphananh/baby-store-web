/**
 * Domain types for `public.orders` — read-only slice needed for the
 * Customer Detail purchase-history view (Phase 5.2). Full Order
 * create/edit/complete/cancel is a later phase; this feature currently only
 * *reads* orders, scoped by customer.
 *
 * Lifecycle (real DB `status` CHECK — do not invent values; confirmed by
 * inspecting the existing `complete_order()`/`cancel_order()` RPCs):
 *   draft      → editable cart-like order, not yet a real sale
 *   confirmed  → placed but not yet fulfilled, still pre-inventory
 *   completed  → posted by `complete_order()` (FEFO-allocates batches,
 *                deducts inventory, recalculates subtotal/total from the
 *                real line items) — the only status where `total` is
 *                guaranteed accurate and the sale is actually realized
 *   cancelled  → `cancel_order()` reverses a `completed` order's inventory;
 *                only a `completed` order can be cancelled
 */
export type OrderStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled'

export type OrderPaymentStatus = 'unpaid' | 'partial' | 'paid'

/** One row of a customer's purchase history. */
export type CustomerOrder = {
  id: string
  orderNumber: string
  orderDate: string
  status: OrderStatus
  paymentStatus: OrderPaymentStatus
  itemCount: number
  /** Integer VND. Only trustworthy once `status === 'completed'` — see the type doc above. */
  total: number
}

export type CustomerOrdersFilters = {
  customerId: string
  page: number
  pageSize: number
}

/**
 * Aggregated purchase summary for one customer, from the
 * `customer_order_summary` view (Phase 5.2 migration) — one row per
 * customer, not derived by summing every order client-side.
 */
export type CustomerOrderSummary = {
  totalOrders: number
  completedOrders: number
  /** Integer VND — sum of `completed` orders' `total` only (see `CustomerOrder`'s doc). */
  totalSpent: number
  lastOrderDate: string | null
}
