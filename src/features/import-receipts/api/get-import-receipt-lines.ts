import { supabase } from '@/lib/supabase'
import type { ImportReceiptLine } from '@/features/import-receipts/types/import-receipt'

type LineRow = {
  id: string
  product_id: string | null
  quantity: number
  purchase_price: number
  lot_number: string | null
  manufacture_date: string | null
  expiration_date: string | null
  products: { name: string; sku: string; unit: string } | null
}

/**
 * Read-only line items for a receipt (`public.import_receipt_items`), oldest
 * first. Line entry/editing and stock posting are a later phase — this
 * exists so the detail view shows whatever lines already exist (e.g. on
 * confirmed receipts).
 */
export async function getImportReceiptLines(receiptId: string): Promise<ImportReceiptLine[]> {
  const { data, error } = await supabase
    .from('import_receipt_items')
    .select(
      'id, product_id, quantity, purchase_price, lot_number, manufacture_date, expiration_date, products(name, sku, unit)',
    )
    .eq('import_receipt_id', receiptId)
    .order('id', { ascending: true })
    .returns<LineRow[]>()

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.products?.name ?? null,
    productSku: row.products?.sku ?? null,
    productUnit: row.products?.unit ?? null,
    quantity: row.quantity,
    purchasePrice: row.purchase_price,
    lotNumber: row.lot_number,
    manufactureDate: row.manufacture_date,
    expirationDate: row.expiration_date,
    // Integer VND arithmetic only (`domain-driven-frontend` rule 1).
    lineTotal: row.quantity * row.purchase_price,
  }))
}
