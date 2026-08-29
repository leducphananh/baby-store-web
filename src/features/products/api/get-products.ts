import { supabase } from '@/lib/supabase'
import { PRODUCT_IMAGES_BUCKET } from '@/features/products/api/get-product-images'
import type { Product, ProductFilters, ProductStatus } from '@/features/products/types/product'

/**
 * Explicit shape of the list `select` below. Built with `.returns<T>()`
 * rather than leaning on inference because the dynamic `.or()`/`.eq()`
 * chain degrades supabase-js's generic inference of the embedded
 * `categories` relation (see `typescript-strict` — a narrow, documented
 * boundary type, not an `any`).
 */
type ProductListRow = {
  id: string
  name: string
  sku: string
  barcode: string | null
  category_id: string | null
  brand: string | null
  unit: string
  description: string | null
  default_purchase_price: number
  selling_price: number
  tiktok_price: number | null
  shopee_price: number | null
  minimum_stock: number
  status: string
  origin_country: string | null
  manufacturer: string | null
  distributor: string | null
  source_description: string | null
  created_at: string | null
  updated_at: string | null
  categories: { name: string } | null
}

const LIST_COLUMNS =
  'id, name, sku, barcode, category_id, brand, unit, description, default_purchase_price, ' +
  'selling_price, tiktok_price, shopee_price, minimum_stock, status, origin_country, ' +
  'manufacturer, distributor, source_description, created_at, updated_at, categories(name)'

function toStatus(value: string): ProductStatus {
  // The DB CHECK constraint guarantees one of these two; fall back rather
  // than widening the domain type to `string`.
  return value === 'archived' ? 'archived' : 'active'
}

export type ProductsPage = {
  data: Product[]
  total: number
  /**
   * Signed thumbnail URL by product id, for the page's rows only. Kept
   * beside `data` rather than on each `Product` because it's a
   * list-view-only, short-lived (1h) artifact — the detail view fetches
   * full images separately.
   */
  thumbnails: Map<string, string>
}

/**
 * Server-driven product list: search, category/status filtering, sorting and
 * pagination all run in Postgres (see `table-data-grid`, `supabase-database`)
 * — the client never downloads the whole catalog.
 *
 * On-hand stock and the thumbnail come from two extra **batched** queries
 * keyed by the page's product ids (`.in('product_id', ids)`), not one query
 * per row — three round trips total regardless of page size, never N+1
 * (CLAUDE.md §12, `frontend-performance`).
 */
export async function getProducts(filters: ProductFilters): Promise<ProductsPage> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase.from('products').select(LIST_COLUMNS, { count: 'exact' })

  const search = filters.search.trim()
  if (search) {
    // `,`/`(`/`)` are PostgREST `.or()` delimiters — strip them from user
    // input so a search term containing one can't break the filter
    // expression (see `frontend-security`).
    const safeSearch = search.replace(/[,()]/g, ' ').trim()
    if (safeSearch) {
      query = query.or(
        `name.ilike.%${safeSearch}%,sku.ilike.%${safeSearch}%,barcode.ilike.%${safeSearch}%`,
      )
    }
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  query = query
    .order(filters.sortField, { ascending: !filters.sortDesc })
    // Stable tiebreaker so `range()` page boundaries don't shift between
    // rows that share a sort value (e.g. two products with the same name).
    .order('id', { ascending: true })
    .range(from, to)

  const { data, error, count } = await query.returns<ProductListRow[]>()
  if (error) throw error

  const rows = data ?? []
  const ids = rows.map((row) => row.id)

  const [stockByProduct, thumbByProduct] = await Promise.all([
    getStockByProduct(ids),
    getThumbnailByProduct(ids),
  ])

  const products: Product[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
    brand: row.brand,
    unit: row.unit,
    description: row.description,
    defaultPurchasePrice: row.default_purchase_price,
    sellingPrice: row.selling_price,
    tiktokPrice: row.tiktok_price,
    shopeePrice: row.shopee_price,
    minimumStock: row.minimum_stock,
    status: toStatus(row.status),
    originCountry: row.origin_country,
    manufacturer: row.manufacturer,
    distributor: row.distributor,
    sourceDescription: row.source_description,
    stockQuantity: stockByProduct.get(row.id) ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  return { data: products, total: count ?? 0, thumbnails: thumbByProduct }
}

/** Sum of `remaining_quantity` per product, in one query for the whole page. */
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
    // Integer VND/quantity arithmetic only (`domain-driven-frontend`).
    byProduct.set(row.product_id, (byProduct.get(row.product_id) ?? 0) + row.remaining_quantity)
  }
  return byProduct
}

/**
 * One signed URL per product for the list thumbnail: the primary image if
 * one is flagged, else the first image. Products with no image are simply
 * absent from the map (the column renders a placeholder). Skips the storage
 * call entirely when the page has no images.
 *
 * A thumbnail is cosmetic — this never throws. If the image lookup or the
 * signing call fails, the list still renders (with placeholders) rather than
 * breaking the whole catalog view over a missing picture.
 */
async function getThumbnailByProduct(productIds: string[]): Promise<Map<string, string>> {
  const byProduct = new Map<string, string>()
  if (productIds.length === 0) return byProduct

  const { data, error } = await supabase
    .from('product_images')
    .select('product_id, storage_path, is_primary')
    .in('product_id', productIds)

  if (error || !data || data.length === 0) return byProduct

  const pathByProduct = new Map<string, string>()
  for (const row of data) {
    if (!row.product_id) continue
    if (row.is_primary || !pathByProduct.has(row.product_id)) {
      pathByProduct.set(row.product_id, row.storage_path)
    }
  }
  if (pathByProduct.size === 0) return byProduct

  const paths = [...pathByProduct.values()]
  const { data: signed, error: signError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .createSignedUrls(paths, 60 * 60)
  if (signError || !signed) return byProduct

  const urlByPath = new Map<string, string>()
  for (const item of signed) {
    if (item.signedUrl && item.path) urlByPath.set(item.path, item.signedUrl)
  }
  for (const [productId, path] of pathByProduct) {
    const url = urlByPath.get(path)
    if (url) byProduct.set(productId, url)
  }
  return byProduct
}
