import { supabase } from '@/lib/supabase'
import type { Product, ProductStatus } from '@/features/products/types/product'

type ProductDetailRow = {
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

function toStatus(value: string): ProductStatus {
  return value === 'archived' ? 'archived' : 'active'
}

/**
 * Single product for the detail page. Returns `null` when the id doesn't
 * exist (or is hidden by RLS) so the route can render a "not found" state
 * instead of throwing. On-hand stock is aggregated from the batch ledger in
 * one extra query.
 */
export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, name, sku, barcode, category_id, brand, unit, description, default_purchase_price, ' +
        'selling_price, tiktok_price, shopee_price, minimum_stock, status, origin_country, ' +
        'manufacturer, distributor, source_description, created_at, updated_at, categories(name)',
    )
    .eq('id', id)
    .maybeSingle<ProductDetailRow>()

  if (error) throw error
  if (!data) return null

  const { data: batchRows, error: batchError } = await supabase
    .from('product_batches')
    .select('remaining_quantity')
    .eq('product_id', id)

  if (batchError) throw batchError

  const stockQuantity = (batchRows ?? []).reduce((sum, row) => sum + row.remaining_quantity, 0)

  return {
    id: data.id,
    name: data.name,
    sku: data.sku,
    barcode: data.barcode,
    categoryId: data.category_id,
    categoryName: data.categories?.name ?? null,
    brand: data.brand,
    unit: data.unit,
    description: data.description,
    defaultPurchasePrice: data.default_purchase_price,
    sellingPrice: data.selling_price,
    tiktokPrice: data.tiktok_price,
    shopeePrice: data.shopee_price,
    minimumStock: data.minimum_stock,
    status: toStatus(data.status),
    originCountry: data.origin_country,
    manufacturer: data.manufacturer,
    distributor: data.distributor,
    sourceDescription: data.source_description,
    stockQuantity,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
