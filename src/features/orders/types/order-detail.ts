import type { OrderPaymentStatus, OrderStatus } from '@/features/orders/types/order'

/**
 * One batch a line item's quantity was actually allocated from, captured by
 * `complete_order()`'s FEFO loop at sale time (`order_item_batches`). Only
 * exists once an order has been posted (`completed`/`cancelled` — see
 * `OrderLine`'s doc). `unitCost` is the batch's `purchase_price` *at that
 * moment*, copied onto the row — the real historical COGS for this sale,
 * never re-derived from the batch's current `purchase_price` (which doesn't
 * change, but the principle is the same one that applies to `unitPrice`
 * below: read the snapshot, never the live source).
 */
export type OrderLineBatchAllocation = {
  id: string
  batchId: string | null
  lotNumber: string | null
  expirationDate: string | null
  quantity: number
  /** Integer VND, historical. */
  unitCost: number
}

/**
 * One line of an order. `unitPrice`/`discount`/`lineTotal` are read
 * straight from `order_items` — the price actually charged at sale time —
 * never from `products.selling_price` (today's price, which can have
 * changed since). `productName`/`productSku`/`productUnit` come from a
 * live join for display/navigation convenience only; if the product's name
 * changes later this label follows, same as everywhere else in the app
 * that joins a product for display — only the *money* fields are frozen.
 */
export type OrderLine = {
  id: string
  productId: string | null
  productName: string | null
  productSku: string | null
  productUnit: string | null
  quantity: number
  /** Integer VND — the historical unit price charged, not today's `selling_price`. */
  unitPrice: number
  discount: number
  /** Integer VND — `quantity * unitPrice - discount`, as stored (not recomputed here). */
  lineTotal: number
  /** FEFO batch allocation for this line — empty for a `draft`/`confirmed` order (not posted yet). */
  batches: OrderLineBatchAllocation[]
}

export type OrderPaymentMethod = 'cash' | 'bank_transfer' | 'other'

export type OrderPayment = {
  id: string
  amount: number
  paymentMethod: OrderPaymentMethod
  paidAt: string | null
  note: string | null
}

/** Full read model for the Order Detail page (Phase 6.3). */
export type OrderDetail = {
  id: string
  orderNumber: string
  customerId: string | null
  customerName: string | null
  customerPhone: string | null
  orderDate: string
  status: OrderStatus
  paymentStatus: OrderPaymentStatus
  /** Integer VND, all read straight from `orders` — never recomputed client-side. */
  subtotal: number
  discount: number
  total: number
  note: string | null
  createdById: string | null
  createdByName: string | null
  createdAt: string | null
  updatedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
}
