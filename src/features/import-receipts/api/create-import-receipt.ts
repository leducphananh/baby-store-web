import { supabase } from '@/lib/supabase'
import { toImportDateISO } from '@/features/import-receipts/utils/import-receipt-date'
import type { ImportReceiptFormValues } from '@/features/import-receipts/schemas/import-receipt-schema'

export type CreateImportReceiptInput = ImportReceiptFormValues & {
  /** Current user's id for `created_by`; `null` if somehow unavailable. */
  createdBy: string | null
}

/**
 * Create a **draft** import receipt (header only). A single-row insert — no
 * multi-step write, so no atomicity concern (line entry + stock posting,
 * which do need an RPC, are a later phase — see the Phase 4.1 report).
 * `status` is always `'draft'`; it is never client-selectable.
 */
export async function createImportReceipt(
  input: CreateImportReceiptInput,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('import_receipts')
    .insert({
      receipt_number: input.receiptNumber.trim(),
      supplier_id: input.supplierId,
      import_date: toImportDateISO(input.importDate),
      notes: input.notes.trim() ? input.notes.trim() : null,
      status: 'draft',
      created_by: input.createdBy,
    })
    .select('id')
    .single()

  if (error) throw error
  return { id: data.id }
}
