import { supabase } from '@/lib/supabase'

/** Via `delete_import_receipt_item` — same atomicity/authoritative-total rationale as add. */
export async function deleteImportReceiptItem(itemId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_import_receipt_item', { p_item_id: itemId })
  if (error) throw error
}
