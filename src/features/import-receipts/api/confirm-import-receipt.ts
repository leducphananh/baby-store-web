import { supabase } from '@/lib/supabase'

/**
 * Posts a **draft** import receipt into inventory: creates one
 * `product_batches` row per line item plus a matching `IMPORT`
 * `inventory_transactions` row, then marks the receipt `confirmed` — all in
 * one Postgres transaction via `confirm_import_receipt()` (see the Phase 4.7
 * migration). Never implemented as separate client-side insert/update
 * calls: a partial failure would leave a receipt with only some of its
 * stock posted (CLAUDE.md §11, `domain-driven-frontend` rule 13,
 * `supabase-database` rule 7).
 *
 * The RPC re-validates everything server-side (draft status, at least one
 * item, each item's product/quantity/price) rather than trusting the
 * client's earlier Zod validation — and is itself protected against
 * double-posting by a `SELECT ... FOR UPDATE` row lock plus a conditional
 * status check (a second concurrent call sees `status != 'draft'` and is
 * rejected, never posts stock twice).
 */
export async function confirmImportReceipt(id: string): Promise<void> {
  const { error } = await supabase.rpc('confirm_import_receipt', { p_receipt_id: id })
  if (error) throw error
}
