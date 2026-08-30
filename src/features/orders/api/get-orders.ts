import { supabase } from '@/lib/supabase'
import { nextDayYmd } from '@/utils/date'
import type { Order, OrderPaymentStatus, OrderStatus, OrdersFilters } from '@/features/orders/types/order'

/**
 * Explicit shape of the list `select` — the embedded `customers(name, phone)`
 * relation degrades supabase-js's generic inference (same approach as
 * `get-import-receipts.ts`).
 */
type OrderListRow = {
  id: string
  order_number: string
  customer_id: string | null
  order_date: string
  status: string
  payment_status: string
  total: number
  customers: { name: string; phone: string | null } | null
}

const LIST_COLUMNS =
  'id, order_number, customer_id, order_date, status, payment_status, total, customers(name, phone)'

function toOrderStatus(value: string): OrderStatus {
  // Guaranteed by the DB CHECK constraint; fall back rather than widening.
  if (value === 'confirmed' || value === 'completed' || value === 'cancelled') return value
  return 'draft'
}

function toPaymentStatus(value: string): OrderPaymentStatus {
  if (value === 'partial' || value === 'paid') return value
  return 'unpaid'
}

function toOrder(row: OrderListRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerName: row.customers?.name ?? null,
    customerPhone: row.customers?.phone ?? null,
    orderDate: row.order_date,
    status: toOrderStatus(row.status),
    paymentStatus: toPaymentStatus(row.payment_status),
    total: row.total,
  }
}

export type OrdersPage = {
  data: Order[]
  total: number
}

/**
 * Customer ids whose `name` or `phone` matches `search` — used to let the
 * order search box also match by customer, without an inner join on
 * `customers` (which would silently exclude walk-in orders that have no
 * linked customer). One bounded query, independent of the orders page size
 * or result count — not N+1.
 */
async function findMatchingCustomerIds(search: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('id')
    .or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    .limit(200)

  if (error) throw error
  return (data ?? []).map((row) => row.id)
}

/**
 * Server-driven order list: search by order code or the linked customer's
 * name/phone, status, payment status, and an inclusive `order_date` range —
 * all in Postgres (see `table-data-grid`, `supabase-database`). Deliberately
 * does not embed `order_items`, since none of the list's required columns
 * need a line-item count — one round trip against `orders` per page (plus
 * one bounded lookup against `customers` only when the search box is used).
 */
export async function getOrders(filters: OrdersFilters): Promise<OrdersPage> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase.from('orders').select(LIST_COLUMNS, { count: 'exact' })

  const search = filters.search.trim()
  if (search) {
    // Strip PostgREST filter delimiters from raw input (see `frontend-security`).
    const safeSearch = search.replace(/[,()%]/g, ' ').trim()
    if (safeSearch) {
      const orConditions = [`order_number.ilike.%${safeSearch}%`]
      const matchingCustomerIds = await findMatchingCustomerIds(safeSearch)
      if (matchingCustomerIds.length > 0) {
        orConditions.push(`customer_id.in.(${matchingCustomerIds.join(',')})`)
      }
      query = query.or(orConditions.join(','))
    }
  }

  if (filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.paymentStatus !== 'all') query = query.eq('payment_status', filters.paymentStatus)
  if (filters.fromDate) query = query.gte('order_date', filters.fromDate)
  // Exclusive upper bound at the start of the next day so the whole `toDate` is included.
  if (filters.toDate) query = query.lt('order_date', nextDayYmd(filters.toDate))

  query = query
    .order(filters.sortField, { ascending: !filters.sortDesc })
    .order('id', { ascending: true })
    .range(from, to)

  const { data, error, count } = await query.returns<OrderListRow[]>()
  if (error) throw error

  return { data: (data ?? []).map(toOrder), total: count ?? 0 }
}
