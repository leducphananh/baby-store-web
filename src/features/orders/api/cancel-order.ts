import { supabase } from '@/lib/supabase'

/**
 * Cancels a **completed** order via the existing `cancel_order()` RPC
 * (already shipped before this phase, unchanged here). For every batch the
 * order's items were FEFO-allocated from, it adds the quantity back onto
 * `product_batches.remaining_quantity` and writes a matching `ORDER_CANCEL`
 * `inventory_transactions` row — a traceable reversal, never a bare stock
 * patch (`domain-driven-frontend` rule 15). All inside one transaction: the
 * whole reversal happens or none of it does.
 *
 * Distinct from `cancelDraftOrder`: a draft/confirmed order never touched
 * inventory, so cancelling one is a plain status flip; a completed order
 * did, so cancelling one is a real accounting event.
 */
export async function cancelOrder(id: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_order', { p_order_id: id })
  if (error) throw error
}
