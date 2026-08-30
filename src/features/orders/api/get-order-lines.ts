import { supabase } from '@/lib/supabase'
import type { OrderLine } from '@/features/orders/types/order-detail'

/**
 * Explicit shape of the select — two levels of embedded relations (line →
 * its batch allocations → each batch's lot/expiry) degrade supabase-js's
 * generic inference (same approach as `get-receipt-batches.ts`).
 *
 * Deliberately does NOT select `products.selling_price` — this is exactly
 * the join a naive implementation could reach for to show a line's "price"
 * and get it wrong, showing today's price instead of what was actually
 * charged. `unit_price`/`line_total` below come only from `order_items`.
 */
type OrderLineRow = {
  id: string
  product_id: string | null
  quantity: number
  unit_price: number
  discount: number
  line_total: number
  products: { name: string; sku: string; unit: string } | null
  order_item_batches: {
    id: string
    batch_id: string | null
    quantity: number
    unit_cost: number
    product_batches: { lot_number: string | null; expiration_date: string | null } | null
  }[]
}

const COLUMNS =
  'id, product_id, quantity, unit_price, discount, line_total, products(name, sku, unit), ' +
  'order_item_batches(id, batch_id, quantity, unit_cost, product_batches(lot_number, expiration_date))'

/**
 * An order's line items with their FEFO batch allocation, one round trip
 * (no N+1 per line — see `table-data-grid`). `order_item_batches` is empty
 * for a `draft`/`confirmed` order: it's only populated by `complete_order()`
 * when the sale is actually posted (see `OrderLine`'s doc).
 */
export async function getOrderLines(orderId: string): Promise<OrderLine[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select(COLUMNS)
    .eq('order_id', orderId)
    .returns<OrderLineRow[]>()

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.products?.name ?? null,
    productSku: row.products?.sku ?? null,
    productUnit: row.products?.unit ?? null,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    discount: row.discount,
    lineTotal: row.line_total,
    batches: row.order_item_batches
      .map((batch) => ({
        id: batch.id,
        batchId: batch.batch_id,
        lotNumber: batch.product_batches?.lot_number ?? null,
        expirationDate: batch.product_batches?.expiration_date ?? null,
        quantity: batch.quantity,
        unitCost: batch.unit_cost,
      }))
      // Same FEFO reading order as everywhere else batches are listed.
      .sort((a, b) => {
        if (!a.expirationDate) return 1
        if (!b.expirationDate) return -1
        return a.expirationDate.localeCompare(b.expirationDate)
      }),
  }))
}
