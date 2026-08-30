import { supabase } from '@/lib/supabase'

export type UpdateOrderDraftInput = {
  orderId: string
  customerId: string | null
  note: string
  items: {
    productId: string
    quantity: number
    unitPrice: number
  }[]
}

/**
 * Edits a `draft`/`confirmed` order atomically via `update_order_draft()`
 * (Phase 6.4 migration) — replaces the customer/note/items in one Postgres
 * transaction, not a chain of separate updates that could leave the order
 * half-edited (same reasoning as `create-order.ts`). Raises (mapped to
 * `OrderNotEditableError`-equivalent text) if the order stopped being
 * editable between load and save.
 */
export async function updateOrderDraft(input: UpdateOrderDraftInput): Promise<void> {
  const { error } = await supabase.rpc('update_order_draft', {
    p_order_id: input.orderId,
    // See `create-order.ts`'s identical cast: the generated `Args` type
    // marks this non-nullable because the SQL parameter has no default, but
    // it's a plain `uuid` (no `NOT NULL`) and null means "no customer".
    p_customer_id: input.customerId as string,
    p_note: input.note,
    p_items: input.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
  })
  if (error) throw error
}
