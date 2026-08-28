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
 */
export function toProductRow(values: ProductFormValues): TablesInsert<'products'> {
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
    minimum_stock: values.minimumStock,
    status: values.status,
  }
}
