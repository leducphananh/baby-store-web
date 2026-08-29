import { supabase } from '@/lib/supabase'
import type {
  ExpiryStatus,
  InventoryOverviewFilters,
  InventoryOverviewPage,
  InventoryOverviewRow,
  StockStatus,
} from '@/features/inventory/types/inventory-overview'

/**
 * Explicit shape of the view select — every column comes back nullable from
 * the generated view type (Postgres doesn't carry the underlying tables'
 * NOT NULL guarantees through a view), even though `product_id`/`name`/`sku`
 * can never actually be null for a real product row. Narrowed here once,
 * the one documented boundary (same approach as `get-products.ts`).
 */
type InventoryOverviewViewRow = {
  product_id: string | null
  name: string | null
  sku: string | null
  barcode: string | null
  unit: string | null
  minimum_stock: number | null
  product_status: string | null
  category_id: string | null
  category_name: string | null
  stock_quantity: number | null
  batch_count: number | null
  nearest_expiration: string | null
  stock_status: string | null
  expiry_status: string | null
}

const VIEW = 'product_inventory_overview'

function toProductStatus(value: string | null): 'active' | 'archived' {
  return value === 'archived' ? 'archived' : 'active'
}

function toStockStatus(value: string | null): StockStatus {
  if (value === 'out_of_stock' || value === 'low_stock') return value
  return 'normal'
}

function toExpiryStatus(value: string | null): ExpiryStatus {
  if (value === 'expired' || value === 'expiring_soon') return value
  return 'none'
}

/**
 * Server-driven inventory overview: search, category/stock-status/expiry-
 * status filtering, sorting and pagination all run in Postgres against
 * `product_inventory_overview` (see `table-data-grid`, `supabase-database`)
 * — the client never downloads the whole catalog, and never filters an
 * already-fetched page (`dashboard-ui` rule 7a). No extra batched queries
 * needed here — the view already carries the per-product batch aggregation.
 */
export async function getInventoryOverview(
  filters: InventoryOverviewFilters,
): Promise<InventoryOverviewPage> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase.from(VIEW).select('*', { count: 'exact' })

  const search = filters.search.trim()
  if (search) {
    // Same `.or()` delimiter-safety as `get-products.ts` — strip PostgREST's
    // filter-expression delimiters out of user input (`frontend-security`).
    const safeSearch = search.replace(/[,()]/g, ' ').trim()
    if (safeSearch) {
      query = query.or(
        `name.ilike.%${safeSearch}%,sku.ilike.%${safeSearch}%,barcode.ilike.%${safeSearch}%`,
      )
    }
  }

  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.stockStatus !== 'all') query = query.eq('stock_status', filters.stockStatus)
  if (filters.expiryStatus !== 'all') query = query.eq('expiry_status', filters.expiryStatus)

  query = query
    .order(filters.sortField, {
      ascending: !filters.sortDesc,
      nullsFirst: filters.sortField === 'nearest_expiration' ? !filters.sortDesc : undefined,
    })
    // Stable tiebreaker so `range()` page boundaries don't shift between
    // rows that share a sort value.
    .order('product_id', { ascending: true })
    .range(from, to)

  const { data, error, count } = await query.returns<InventoryOverviewViewRow[]>()
  if (error) throw error

  const rows: InventoryOverviewRow[] = (data ?? []).map((row) => ({
    // Non-null: every row of this view comes from a real `products` row,
    // whose `id`/`name`/`sku` are NOT NULL — the view just can't express
    // that in its generated type (see the boundary type's comment above).
    productId: row.product_id as string,
    name: row.name as string,
    sku: row.sku as string,
    barcode: row.barcode,
    unit: row.unit as string,
    minimumStock: row.minimum_stock ?? 0,
    productStatus: toProductStatus(row.product_status),
    categoryId: row.category_id,
    categoryName: row.category_name,
    stockQuantity: row.stock_quantity ?? 0,
    batchCount: row.batch_count ?? 0,
    nearestExpiration: row.nearest_expiration,
    stockStatus: toStockStatus(row.stock_status),
    expiryStatus: toExpiryStatus(row.expiry_status),
  }))

  return { data: rows, total: count ?? 0 }
}
