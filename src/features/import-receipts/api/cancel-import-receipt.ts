import { supabase } from '@/lib/supabase'
import { ImportReceiptNotEditableError } from '@/features/import-receipts/api/import-receipt-errors'

/**
 * Void a **draft** import receipt by moving it to `cancelled`.
 *
 * This is the only removal path offered: there is no hard delete (the DB has
 * no DELETE policy on `import_receipts`, by design). Cancelling is gated to
 * `draft` via `.eq('status', 'draft')` — a `confirmed` receipt has already
 * created batches and inventory transactions, and the current schema has no
 * safe un-posting path, so it must stay untouched (CLAUDE.md §11).
 */
export async function cancelImportReceipt(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('import_receipts')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'draft')
    .select('id')

  if (error) throw error
  if (!data || data.length === 0) throw new ImportReceiptNotEditableError()
}
