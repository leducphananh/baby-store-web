import { supabase } from '@/lib/supabase'
import type { OrderPayment, OrderPaymentMethod } from '@/features/orders/types/order-detail'

type OrderPaymentRow = {
  id: string
  amount: number
  payment_method: string
  paid_at: string | null
  note: string | null
}

const COLUMNS = 'id, amount, payment_method, paid_at, note'

function toPaymentMethod(value: string): OrderPaymentMethod {
  if (value === 'bank_transfer' || value === 'other') return value
  return 'cash'
}

/**
 * Payments recorded against one order, oldest first. Recording a payment is
 * a later phase (this phase only reads); an empty result is the normal
 * state for every order today, not an error.
 */
export async function getOrderPayments(orderId: string): Promise<OrderPayment[]> {
  const { data, error } = await supabase
    .from('order_payments')
    .select(COLUMNS)
    .eq('order_id', orderId)
    .order('paid_at', { ascending: true })
    .returns<OrderPaymentRow[]>()

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    amount: row.amount,
    paymentMethod: toPaymentMethod(row.payment_method),
    paidAt: row.paid_at,
    note: row.note,
  }))
}
