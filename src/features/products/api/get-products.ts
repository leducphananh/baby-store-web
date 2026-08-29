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
  /**
   * Supplier name by product id, for the page's rows only — same rationale
   * as `thumbnails` (a list-view-only derived value, not a real `Product`
   * field; see `getSupplierNameByProduct`). Absent from the map for a
   * product with no confirmed purchase history.
   */
  supplierNames: Map<string, string>
}

/**
 * Server-driven product list: search, category/status filtering, sorting and
 * pagination all run in Postgres (see `table-data-grid`, `supabase-database`)
 * — the client never downloads the whole catalog.
 *
 * On-hand stock, the thumbnail, and the supplier name come from three extra
 * **batched** queries keyed by the page's product ids (`.in('product_id',
 * ids)`), not one query per row — four round trips total regardless of page
 * size, never N+1 (CLAUDE.md §12, `frontend-performance`).
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

  const [stockByProduct, thumbByProduct, supplierByProduct] = await Promise.all([
    getStockByProduct(ids),
    getThumbnailByProduct(ids),
    getSupplierNameByProduct(ids),
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

  return { data: products, total: count ?? 0, thumbnails: thumbByProduct, supplierNames: supplierByProduct }
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

/**
 * Explicit shape of the supplier-lookup select — same reasoning as
 * `ProductListRow`: the nested `import_receipts -> suppliers` embed
 * degrades supabase-js's generic inference.
 */
type SupplierByImportRow = {
  product_id: string | null
  import_receipts: {
    suppliers: { name: string } | null
  } | null
}

/**
 * The product schema has no direct `products.supplier_id` — a product's
 * "supplier" is only ever known through its purchase history
 * (`import_receipt_items -> import_receipts -> suppliers`). This resolves it
 * as **the supplier of the most recent CONFIRMED import** for each product
 * (draft/cancelled receipts never actually happened — see
 * `ImportReceiptStatus`), which is the one supplier-like fact this schema
 * can state without inventing a relationship. A product never purchased
 * from (or only via a draft/cancelled receipt) simply has no entry here —
 * the column renders "—", never a guess.
 *
 * `!inner` on the `import_receipts` embed is required to filter it by
 * `status` server-side; ordering by the receipt's own `import_date` (its
 * business date) then `confirmed_at` (tiebreaker) means the first row seen
 * per product, scanned in order below, is already its latest one — no
 * separate MAX() query needed.
 */
async function getSupplierNameByProduct(productIds: string[]): Promise<Map<string, string>> {
  const byProduct = new Map<string, string>()
  if (productIds.length === 0) return byProduct

  const { data, error } = await supabase
    .from('import_receipt_items')
    .select('product_id, import_receipts!inner(import_date, confirmed_at, status, suppliers(name))')
    .in('product_id', productIds)
    .eq('import_receipts.status', 'confirmed')
    .order('import_date', { referencedTable: 'import_receipts', ascending: false })
    .order('confirmed_at', { referencedTable: 'import_receipts', ascending: false })
    .returns<SupplierByImportRow[]>()

  // Cosmetic/derived, same as the thumbnail lookup above — never break the
  // whole list over a supplier-name lookup failure.
  if (error || !data) return byProduct

  for (const row of data) {
    if (!row.product_id || byProduct.has(row.product_id)) continue
    const supplierName = row.import_receipts?.suppliers?.name
    if (supplierName) byProduct.set(row.product_id, supplierName)
  }
  return byProduct
}
