/**
 * Domain model for `public.products`, derived from the generated
 * `Database` types (see `supabase-database`). Field names map the snake_case
 * columns to the app's camelCase vocabulary; nullability matches the real
 * schema exactly — no invented frontend-only fields.
 *
 * `products` has a real `status` column with a DB `CHECK ('active',
 * 'archived')` constraint, so the delete flow prefers archiving over
 * destruction: a product referenced by orders / import receipts / batches /
 * inventory transactions (all `ON DELETE RESTRICT`) cannot be hard-deleted,
 * and shouldn't be — its history must stay intact (CLAUDE.md §8/§11,
 * `domain-driven-frontend`).
 */
export type ProductStatus = 'active' | 'archived'

/** Prices are integer VND (`numeric(15,0)` columns) — never floats. */
export type Product = {
  id: string
  name: string
  sku: string
  barcode: string | null
  categoryId: string | null
  /** Joined from `categories.name`; `null` when the product has no category. */
  categoryName: string | null
  brand: string | null
  unit: string
  description: string | null
  defaultPurchasePrice: number
  sellingPrice: number
  minimumStock: number
  status: ProductStatus
  originCountry: string | null
  manufacturer: string | null
  distributor: string | null
  sourceDescription: string | null
  /**
   * Sum of `product_batches.remaining_quantity` for this product. Derived
   * from the batch ledger, not a mutable column (see `domain-driven-frontend`
   * rule 4). `0` means "in the catalog, no stock on hand".
   */
  stockQuantity: number
  createdAt: string | null
  updatedAt: string | null
}

/** A single stock lot — carries manufacture/expiry dates (see `domain-driven-frontend` rule 2). */
export type ProductBatch = {
  id: string
  lotNumber: string | null
  manufactureDate: string | null
  expirationDate: string | null
  initialQuantity: number
  remainingQuantity: number
  purchasePrice: number
  createdAt: string | null
}

export type ProductImage = {
  id: string
  /** Object key inside the private `product-images` bucket — needed to delete it. */
  storagePath: string
  isPrimary: boolean
  createdAt: string | null
  /** Short-lived signed URL for display; regenerated on each fetch. */
  url: string
}

export type ProductInventorySummary = {
  totalRemaining: number
  batchCount: number
  /** Soonest `expiration_date` among batches with stock left; `null` if none. */
  nearestExpiration: string | null
}

export type ProductSortField =
  | 'name'
  | 'sku'
  | 'default_purchase_price'
  | 'selling_price'
  | 'created_at'

/** `'all'` skips the status filter entirely. */
export type ProductStatusFilter = 'all' | ProductStatus

export type ProductFilters = {
  search: string
  /** `null` = every category. */
  categoryId: string | null
  status: ProductStatusFilter
  page: number
  pageSize: number
  sortField: ProductSortField
  sortDesc: boolean
}
