import { supabase } from '@/lib/supabase'
import type {
  CustomerOrder,
  CustomerOrdersFilters,
  OrderPaymentStatus,
  OrderStatus,
} from '@/features/orders/types/order'

/**
 * Explicit shape of the select — the embedded `order_items(count)` aggregate
 * degrades supabase-js's generic inference (same approach as
 * `get-import-receipts.ts`).
 */
type CustomerOrderRow = {
  id: string
  order_number: string
  order_date: string
  status: string
  payment_status: string
  total: number
  order_items: { count: number }[]
}

const COLUMNS = 'id, order_number, order_date, status, payment_status, total, order_items(count)'

function toOrderStatus(value: string): OrderStatus {
  // Guaranteed by the DB CHECK constraint; fall back rather than widening.
  if (value === 'confirmed' || value === 'completed' || value === 'cancelled') return value
  return 'draft'
}

function toPaymentStatus(value: string): OrderPaymentStatus {
  if (value === 'partial' || value === 'paid') return value
  return 'unpaid'
}

export type CustomerOrdersPage = {
  data: CustomerOrder[]
  total: number
}

/**
 * One customer's purchase history, paginated and newest-first — one round
 * trip regardless of how many line items each order has (item count comes
 * from an embedded `count` aggregate, no N+1 per order; see
 * `table-data-grid`, `supabase-database`). Uses the existing
 * `idx_orders_customer_recent (customer_id, created_at desc)` index's
 * leading `customer_id` column for the filter; sorted by the business-
 * relevant `order_date` rather than `created_at`, matching the convention
 * already used for import receipts.
 */
export async function getCustomerOrders(filters: CustomerOrdersFilters): Promise<CustomerOrdersPage> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  const { data, error, count } = await supabase
    .from('orders')
    .select(COLUMNS, { count: 'exact' })
    .eq('customer_id', filters.customerId)
    .order('order_date', { ascending: false })
    // Stable tiebreaker so `range()` page boundaries don't shift between
    // rows that share an `order_date`.
    .order('id', { ascending: true })
    .range(from, to)
    .returns<CustomerOrderRow[]>()

  if (error) throw error

  const orders: CustomerOrder[] = (data ?? []).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    orderDate: row.order_date,
    status: toOrderStatus(row.status),
    paymentStatus: toPaymentStatus(row.payment_status),
    itemCount: row.order_items[0]?.count ?? 0,
    total: row.total,
  }))

  return { data: orders, total: count ?? 0 }
}
