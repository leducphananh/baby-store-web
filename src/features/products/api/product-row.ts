import type { TablesInsert } from '@/types/database'
import type { ProductFormValues } from '@/features/products/schemas/product-schema'

function orNull(value: string): string | null {
  return value.trim() ? value.trim() : null
}

/**
 * Map validated form values to a `products` row for insert/update. The one
 * place empty optional strings become `null` and `categoryId === ''` becomes
 * a null FK — shared by `createProduct` and `updateProduct` so the two never
 * drift (see `clean-code`).
 *
 * Deliberately never includes `slug`: it's `NOT NULL` with no SQL-level
 * `DEFAULT`, filled in only by the `products_set_slug` BEFORE INSERT
 * trigger (`set_slug_from_name()`, added by the storefront-catalog
 * migration) — and only on INSERT, and only when the incoming value is
 * exactly `NULL` (verified in the trigger body; it leaves a non-null
 * value, including `''`, untouched). There is no UPDATE trigger for it at
 * all, so a product's slug is stable once created even if its name later
 * changes — the right behavior for a public storefront URL. `createProduct`
 * is the one caller that needs to actually satisfy the stricter `Insert`
 * shape; see its own comment for the resulting cast.
 */
export function toProductRow(values: ProductFormValues): Omit<TablesInsert<'products'>, 'slug'> {
  return {
    name: values.name.trim(),
    sku: values.sku.trim(),
    barcode: orNull(values.barcode),
    category_id: values.categoryId ? values.categoryId : null,
    brand: orNull(values.brand),
    unit: values.unit.trim(),
    description: orNull(values.description),
    origin_country: orNull(values.originCountry),
    manufacturer: orNull(values.manufacturer),
    distributor: orNull(values.distributor),
    source_description: orNull(values.sourceDescription),
    default_purchase_price: values.defaultPurchasePrice,
    selling_price: values.sellingPrice,
    tiktok_price: values.tiktokPrice,
    shopee_price: values.shopeePrice,
    minimum_stock: values.minimumStock,
    status: values.status,
    is_web_visible: values.isWebVisible,
  }
}
