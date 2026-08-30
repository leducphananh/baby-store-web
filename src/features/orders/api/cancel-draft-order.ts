import { supabase } from '@/lib/supabase'
import { OrderNotEditableError } from '@/features/orders/api/order-errors'

/**
 * Void a **draft/confirmed** order by moving it to `cancelled` — the exact
 * same shape as `cancelImportReceipt`: a single guarded `UPDATE ... WHERE
 * status IN (...)`, atomic and race-safe on its own (no RPC needed, unlike
 * `updateOrderDraft`) because it's one row, one table, no side effects — a
 * draft/confirmed order has never touched inventory, so there is nothing to
 * reverse. Contrast with `cancelOrder`, which cancels a `completed` order
 * and must reverse real inventory deductions (see its own doc comment).
 *
 * `.eq('status', ...)` is the real guard: if the order was completed or
 * already cancelled between load and click, zero rows match and we raise
 * `OrderNotEditableError` instead of silently doing nothing.
 */
export async function cancelDraftOrder(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .in('status', ['draft', 'confirmed'])
    .select('id')

  if (error) throw error
  if (!data || data.length === 0) throw new OrderNotEditableError()
}
