import { supabase } from '@/lib/supabase'

export type ProductSearchResult = {
  id: string
  name: string
  sku: string
  unit: string
  defaultPurchasePrice: number
  stockQuantity: number
}

const RESULT_LIMIT = 20

/**
 * Lean product lookup for search-as-you-type pickers (import receipt lines,
 * later order lines) — a handful of display columns only, capped at 20
 * rows, never the full catalog (see `frontend-performance`). Distinct from
 * `getProducts` (the paginated list view), which also joins stock/thumbnail
 * for a whole page and would be wasteful to run on every keystroke.
 *
 * Archived products are excluded: you don't receive stock against a
 * discontinued catalog entry.
 */
export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  let request = supabase
    .from('products')
    .select('id, name, sku, unit, default_purchase_price')
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

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    unit: row.unit,
    defaultPurchasePrice: row.default_purchase_price,
    stockQuantity: stockByProduct.get(row.id) ?? 0,
  }))
}

/** Same batched pattern as `get-products.ts` — one query, never N+1. */
async function getStockByProduct(productIds: string[]): Promise<Map<string, number>> {
  const byProduct = new Map<string, number>()
  if (productIds.length === 0) return byProduct

  const { data, error } = await supabase
    .from('product_batches')
    .select('product_id, remaining_quantity')
    .in('product_id', productIds)

  if (error) throw error

  for (const row of data ?? []) {
    if (!row.product_id) continue
    byProduct.set(row.product_id, (byProduct.get(row.product_id) ?? 0) + row.remaining_quantity)
  }
  return byProduct
}
