import { supabase } from '@/lib/supabase'
import { todayYmd } from '@/utils/date'

export type ProductSearchResult = {
  id: string
  name: string
  sku: string
  unit: string
  defaultPurchasePrice: number
  sellingPrice: number
  stockQuantity: number
}

export type ProductSearchOptions = {
  /**
   * When true, `stockQuantity` sums only batches that are unexpired
   * (`expiration_date IS NULL OR expiration_date >= today`) — the same
   * condition `complete_order()`'s FEFO allocation uses, so what the order
   * screen shows as "available" always matches what can actually be sold.
   * Default false (every batch's remaining quantity), which is what
   * import-receipt line entry wants: receiving more stock isn't gated by
   * whether existing batches have expired.
   */
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
  options: ProductSearchOptions = {},
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
  const stockByProduct = await getStockByProduct(ids, options.sellableOnly ?? false)

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    unit: row.unit,
    defaultPurchasePrice: row.default_purchase_price,
    sellingPrice: row.selling_price,
    stockQuantity: stockByProduct.get(row.id) ?? 0,
  }))
}

/**
 * Same batched pattern as `get-products.ts` — one query, never N+1.
 * Exported: the Edit Order screen needs this same sellable-stock lookup for
 * a known list of product ids (an order's existing lines), not a text
 * search, so it calls this directly instead of `searchProducts`.
 */
export async function getStockByProduct(
  productIds: string[],
  sellableOnly: boolean,
): Promise<Map<string, number>> {
  const byProduct = new Map<string, number>()
  if (productIds.length === 0) return byProduct

  let request = supabase
    .from('product_batches')
    .select('product_id, remaining_quantity')
    .in('product_id', productIds)

  if (sellableOnly) {
    request = request.or(`expiration_date.is.null,expiration_date.gte.${todayYmd()}`)
  }

  const { data, error } = await request
  if (error) throw error

  for (const row of data ?? []) {
    if (!row.product_id) continue
    byProduct.set(row.product_id, (byProduct.get(row.product_id) ?? 0) + row.remaining_quantity)
  }
  return byProduct
}
