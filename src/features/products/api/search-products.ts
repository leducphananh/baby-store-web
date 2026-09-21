import { supabase } from '@/lib/supabase'
import { todayYmd } from '@/utils/date'

export type ProductSearchResult = {
  id: string
  name: string
  sku: string
  unit: string
  defaultPurchasePrice: number
  sellingPrice: number
  stockQuantity: number // total stock
  sellableQuantity: number // unexpired stock
}

export type ProductSearchOptions = {
  // No longer used, searchProducts always returns both total and sellable quantities.
  sellableOnly?: boolean
}

const RESULT_LIMIT = 20

/**
 * Lean product lookup for search-as-you-type pickers (import receipt lines,
 * order lines) — a handful of display columns only, capped at 20 rows,
 * never the full catalog (see `frontend-performance`). Distinct from
 * `getProducts` (the paginated list view), which also joins stock/thumbnail
 * for a whole page and would be wasteful to run on every keystroke.
 *
 * Archived products are excluded: you don't receive stock against, or sell,
 * a discontinued catalog entry.
 */
export async function searchProducts(
  query: string,
  _options: ProductSearchOptions = {},
): Promise<ProductSearchResult[]> {
  let request = supabase
    .from('products')
    .select('id, name, sku, unit, default_purchase_price, selling_price')
    .eq('status', 'active')
    .order('name', { ascending: true })
    .limit(RESULT_LIMIT)

  const trimmed = query.trim()
  if (trimmed) {
    // Same `.or()` delimiter-safety as the other search queries (see
    // `get-products.ts` / `frontend-security`).
    const safe = trimmed.replace(/[,()]/g, ' ').trim()
    if (safe) {
      request = request.or(`name.ilike.%${safe}%,sku.ilike.%${safe}%,barcode.ilike.%${safe}%`)
    }
  }

  const { data, error } = await request
  if (error) throw error

  const rows = data ?? []
  const ids = rows.map((row) => row.id)
  const stockByProduct = await getStockByProduct(ids)

  return rows.map((row) => {
    const stock = stockByProduct.get(row.id) ?? { total: 0, sellable: 0 }
    return {
      id: row.id,
      name: row.name,
      sku: row.sku,
      unit: row.unit,
      defaultPurchasePrice: row.default_purchase_price,
      sellingPrice: row.selling_price,
      stockQuantity: stock.total,
      sellableQuantity: stock.sellable,
    }
  })
}

/**
 * Same batched pattern as `get-products.ts` — one query, never N+1.
 * Exported: the Edit Order screen needs this same sellable-stock lookup for
 * a known list of product ids (an order's existing lines), not a text
 * search, so it calls this directly instead of `searchProducts`.
 */
export async function getStockByProduct(
  productIds: string[],
): Promise<Map<string, { total: number; sellable: number }>> {
  const byProduct = new Map<string, { total: number; sellable: number }>()
  if (productIds.length === 0) return byProduct

  const { data, error } = await supabase
    .from('product_batches')
    .select('product_id, remaining_quantity, expiration_date')
    .in('product_id', productIds)

  if (error) throw error

  const today = todayYmd()

  for (const row of data ?? []) {
    if (!row.product_id) continue
    const current = byProduct.get(row.product_id) ?? { total: 0, sellable: 0 }
    
    current.total += row.remaining_quantity
    if (!row.expiration_date || row.expiration_date >= today) {
      current.sellable += row.remaining_quantity
    }
    
    byProduct.set(row.product_id, current)
  }
  return byProduct
}
