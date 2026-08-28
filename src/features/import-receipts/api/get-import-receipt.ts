import { supabase } from '@/lib/supabase'
import {
  rowToImportReceipt,
  type ImportReceiptListRow,
} from '@/features/import-receipts/api/get-import-receipts'
import type { ImportReceipt } from '@/features/import-receipts/types/import-receipt'

const DETAIL_COLUMNS =
  'id, receipt_number, supplier_id, import_date, notes, status, total_cost, created_by, ' +
  'created_at, updated_at, confirmed_at, suppliers(name), ' +
  'profiles!import_receipts_created_by_fkey(full_name), import_receipt_items(count)'

/**
 * A single import receipt for the detail page. Returns `null` when the id
 * doesn't exist (or is hidden by RLS) so the route can show a "not found"
 * state instead of throwing.
 */
export async function getImportReceipt(id: string): Promise<ImportReceipt | null> {
  const { data, error } = await supabase
    .from('import_receipts')
    .select(DETAIL_COLUMNS)
    .eq('id', id)
    .maybeSingle<ImportReceiptListRow>()

  if (error) throw error
  if (!data) return null

  return rowToImportReceipt(data)
}
