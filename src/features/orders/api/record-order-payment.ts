import { supabase } from '@/lib/supabase'
import type { OrderPaymentMethod } from '@/features/orders/types/order-detail'

export type RecordOrderPaymentInput = {
  orderId: string
  amount: number
  paymentMethod: OrderPaymentMethod
  note: string
}

/**
 * Records a payment against a **completed** order via `record_order_payment()`
 * (Phase 6.5 migration) — NOT a plain `.insert()`. The RPC inserts the
 * payment and recomputes `orders.payment_status` from the real sum of
 * payments in the same transaction, so the two can never drift out of sync
 * (nothing else in this schema maintains `payment_status` automatically —
 * see the migration's doc comment).
 *
 * There is deliberately no `updateOrderPayment`/`deleteOrderPayment`
 * alongside this: a recorded payment is a historical financial event
 * (`domain-driven-frontend` rule 16). The schema has no correction/reversal
 * mechanism for it yet (no void flag, no negative-amount adjustment row —
 * `amount > 0` is a CHECK constraint), so none is offered here; adding one
 * is a schema decision for a future phase, not something to approximate
 * with a raw `UPDATE`/`DELETE` against `order_payments` (its RLS policy
 * happens to allow both, but that isn't a reason to use them for this).
 */
export async function recordOrderPayment(input: RecordOrderPaymentInput): Promise<string> {
  const { data, error } = await supabase.rpc('record_order_payment', {
    p_order_id: input.orderId,
    p_amount: input.amount,
    p_payment_method: input.paymentMethod,
    p_note: input.note,
  })
  if (error) throw error
  return data
}
