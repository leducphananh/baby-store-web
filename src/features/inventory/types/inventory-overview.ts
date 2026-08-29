/**
 * Domain model for `public.product_inventory_overview` — a read-only,
 * per-product aggregation view over `products` + `product_batches` (Phase
 * 4.6). One row per product; stock/expiry status are computed in Postgres
 * (not the client) so filtering + pagination stay correct against the whole
 * table (see `dashboard-ui` rule 7a, `supabase-database` rule 10).
 *
 * `stockStatus`/`expiryStatus` mirror the view's own `case` expressions —
 * this is the one other place those two classifications are allowed to
 * exist (`domain-driven-frontend` rule 19/20); nothing here re-derives
 * status from raw quantities/dates.
 */
export type StockStatus = 'out_of_stock' | 'low_stock' | 'normal'

/**
 * Coarser than `BatchExpiryStatus` (`features/batches/types/batch.ts`):
 * this is the worst-case status across a *product's* batches with
 * remaining stock, not one batch's own days-remaining/days-ago count. Use
 * `BatchExpiryStatus`/`classifyExpiry` for a single batch's detail.
 */
export type ExpiryStatus = 'expired' | 'expiring_soon' | 'none'

export type InventoryOverviewRow = {
  productId: string
  name: string
  sku: string
  barcode: string | null
  unit: string
  minimumStock: number
  productStatus: 'active' | 'archived'
  categoryId: string | null
  categoryName: string | null
  /** Sum of `product_batches.remaining_quantity` for this product. */
  stockQuantity: number
  /** Count of batches with `remaining_quantity > 0`. */
  batchCount: number
  /** Soonest `expiration_date` among batches with stock left; `null` if none. */
  nearestExpiration: string | null
  stockStatus: StockStatus
  expiryStatus: ExpiryStatus
}

export type StockStatusFilter = 'all' | StockStatus
export type ExpiryStatusFilter = 'all' | ExpiryStatus

export type InventoryOverviewSortField = 'name' | 'stock_quantity' | 'nearest_expiration'

export type InventoryOverviewFilters = {
  search: string
  /** `null` = every category. */
  categoryId: string | null
  stockStatus: StockStatusFilter
  expiryStatus: ExpiryStatusFilter
  page: number
  pageSize: number
  sortField: InventoryOverviewSortField
  sortDesc: boolean
}

export type InventoryOverviewPage = {
  data: InventoryOverviewRow[]
  total: number
}

/**
 * Global counts for the dashboard's alert cards — always unfiltered (the
 * whole inventory), independent of the table's current filters, so they
 * read as a stable at-a-glance summary rather than shifting with whatever
 * the table happens to be filtered to right now (see `dashboard-ui` rule 2).
 */
export type InventoryOverviewSummary = {
  outOfStock: number
  lowStock: number
  expiringSoon: number
  expired: number
}
