import { supabase } from '@/lib/supabase'
import type { AdjustInventoryInput, InventoryAdjustmentResult } from '@/features/inventory/types/inventory-adjustment'

/**
 * The sole path for manual inventory mutation (Phase 8.4) — never a plain
 * `.update()` against `product_batches`. `adjust_inventory()` locks the
 * batch row, validates the requested operation against the SERVER-read
 * current quantity (never trusts a client-computed delta for
 * `STOCK_COUNT`), and writes one `inventory_transactions` row in the same
 * transaction as the quantity change (see the migration's doc comment).
 */
export async function adjustInventory(input: AdjustInventoryInput): Promise<InventoryAdjustmentResult> {
  const { data, error } = await supabase.rpc('adjust_inventory', {
    p_batch_id: input.batchId,
    p_operation_type: input.operationType,
    // Omitted (not `null`) when not applicable — the RPC's own `default
    // null` takes over; the generated `Args` type only allows `undefined`
    // for optional params (same as `p_customer_id` in `create-order.ts`).
    p_write_off_quantity: input.writeOffQuantity ?? undefined,
    p_actual_quantity: input.actualQuantity ?? undefined,
    p_note: input.note?.trim() ? input.note.trim() : undefined,
  })
  if (error) throw error

  const row = data?.[0]
  if (!row) throw new Error('adjust_inventory did not return a result row')

  return {
    batchId: row.batch_id,
    previousQuantity: row.previous_quantity,
    newQuantity: row.new_quantity,
    delta: row.delta,
  }
}
