import { supabase } from '@/lib/supabase'
import { ImportReceiptNotEditableError } from '@/features/import-receipts/api/import-receipt-errors'
import { toImportDateISO } from '@/features/import-receipts/utils/import-receipt-date'
import type { ImportReceiptFormValues } from '@/features/import-receipts/schemas/import-receipt-schema'

/**
 * Update a receipt's **header** — only while it is a `draft`.
 *
 * The `.eq('status', 'draft')` in the update is the real guard: if the
 * receipt was confirmed or cancelled between load and save, zero rows match
 * and we raise `ImportReceiptNotEditableError` instead of silently doing
 * nothing. A confirmed receipt is an immutable stock document (CLAUDE.md
 * §11, `domain-driven-frontend` rule 17); this never lets one be edited.
 */
export async function updateImportReceipt({
  id,
  values,
}: {
  id: string
  values: ImportReceiptFormValues
}): Promise<void> {
  const { data, error } = await supabase
    .from('import_receipts')
    .update({
      receipt_number: values.receiptNumber.trim(),
      supplier_id: values.supplierId,
      import_date: toImportDateISO(values.importDate),
      notes: values.notes.trim() ? values.notes.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'draft')
    .select('id')

  if (error) throw error
  if (!data || data.length === 0) throw new ImportReceiptNotEditableError()
}
