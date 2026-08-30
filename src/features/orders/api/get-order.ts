import { supabase } from '@/lib/supabase'
import type { OrderPaymentStatus, OrderStatus } from '@/features/orders/types/order'
import type { OrderDetail } from '@/features/orders/types/order-detail'

/**
 * Explicit shape of the header select — the embedded `customers`/`profiles`
 * relations degrade supabase-js's generic inference (same approach as
 * `get-import-receipt.ts`).
 */
type OrderRow = {
  id: string
  order_number: string
  customer_id: string | null
  order_date: string
  status: string
  payment_status: string
  subtotal: number
  discount: number
  total: number
  note: string | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  customers: { name: string; phone: string | null } | null
  profiles: { full_name: string | null } | null
}

const COLUMNS =
  'id, order_number, customer_id, order_date, status, payment_status, subtotal, discount, ' +
  'total, note, created_by, created_at, updated_at, completed_at, cancelled_at, ' +
  'customers(name, phone), profiles!orders_created_by_fkey(full_name)'

function toOrderStatus(value: string): OrderStatus {
  if (value === 'confirmed' || value === 'completed' || value === 'cancelled') return value
  return 'draft'
}

function toPaymentStatus(value: string): OrderPaymentStatus {
  if (value === 'partial' || value === 'paid') return value
  return 'unpaid'
}

/** One order's header facts — everything but its lines/payments (see `get-order-lines.ts`, `get-order-payments.ts`). */
export async function getOrder(id: string): Promise<OrderDetail | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle<OrderRow>()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    orderNumber: data.order_number,
    customerId: data.customer_id,
    customerName: data.customers?.name ?? null,
    customerPhone: data.customers?.phone ?? null,
    orderDate: data.order_date,
    status: toOrderStatus(data.status),
    paymentStatus: toPaymentStatus(data.payment_status),
    subtotal: data.subtotal,
    discount: data.discount,
    total: data.total,
    note: data.note,
    createdById: data.created_by,
    createdByName: data.profiles?.full_name ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    completedAt: data.completed_at,
    cancelledAt: data.cancelled_at,
  }
}
