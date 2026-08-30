/**
 * Domain types for `public.orders` — read-only slice needed for the
 * Customer Detail purchase-history view (Phase 5.2) and the store-wide
 * Orders List (Phase 6.1). Full Order create/edit/complete/cancel is a later
 * phase; this feature currently only *reads* orders.
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

/**
 * One row of the store-wide order list (Phase 6.1). A superset of
 * `CustomerOrder` — includes who the order belongs to, since the list isn't
 * scoped to one customer. Deliberately excludes a line-item count: the
 * list's required columns don't need it, and skipping the
 * `order_items(count)` embed keeps every page load to exactly one query
 * against `orders` (see `getOrders`).
 */
export type Order = {
  id: string
  orderNumber: string
  customerId: string | null
  /** `null` when the order has no linked customer (a walk-in/"khách lẻ" sale). */
  customerName: string | null
  customerPhone: string | null
  orderDate: string
  status: OrderStatus
  paymentStatus: OrderPaymentStatus
  /** Integer VND. Only trustworthy once `status === 'completed'` — see `CustomerOrder`'s doc. */
  total: number
}

export type OrderSortField = 'order_date' | 'order_number' | 'total'

export type OrderStatusFilter = 'all' | OrderStatus
export type OrderPaymentStatusFilter = 'all' | OrderPaymentStatus

export type OrdersFilters = {
  /** Matches `order_number`, or the linked customer's name/phone. */
  search: string
  status: OrderStatusFilter
  paymentStatus: OrderPaymentStatusFilter
  /** Inclusive `YYYY-MM-DD` bounds on `order_date`; `null` = unbounded. */
  fromDate: string | null
  toDate: string | null
  page: number
  pageSize: number
  sortField: OrderSortField
  sortDesc: boolean
}
