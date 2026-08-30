import { supabase } from '@/lib/supabase'

export type CreateOrderInput = {
  customerId: string | null
  note: string
  items: {
    productId: string
    quantity: number
    unitPrice: number
  }[]
}

export type CreateOrderResult = {
  id: string
  orderNumber: string
}

/**
 * Creates an order atomically via `create_order()` (Phase 6.2 migration) —
 * NOT a chain of `.insert()` calls. The RPC inserts the order header + every
 * item and immediately posts them to inventory (FEFO batch allocation,
 * server-recomputed subtotal/total) inside one Postgres transaction: either
 * the whole sale happens, or none of it does — never a half-created order,
 * missing items, or a partial inventory deduction (see `supabase-database`,
 * `domain-driven-frontend`).
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const { data, error } = await supabase.rpc('create_order', {
    // The generated `Args` type marks this non-nullable because the SQL
    // parameter has no default — but it's declared plain `uuid` (no `NOT
    // NULL`), and the RPC explicitly treats null as "no customer" (a
    // walk-in sale). Safe to cast: Postgres accepts null for any parameter
    // without a NOT NULL constraint, regardless of what the generator
    // inferred.
    p_customer_id: input.customerId as string,
    p_note: input.note,
    p_items: input.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
  })
  if (error) throw error

  const result = data as { id: string; order_number: string }
  return { id: result.id, orderNumber: result.order_number }
}
