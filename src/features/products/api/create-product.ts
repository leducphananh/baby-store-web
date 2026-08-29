import { supabase } from '@/lib/supabase'
import type { ProductFormValues } from '@/features/products/schemas/product-schema'
import { toProductRow } from '@/features/products/api/product-row'

/**
 * Returns the new row's id — needed by the create-product dialog to upload
 * any pending images under the real product id right after creation (see
 * `product-form-dialog.tsx`; images are never uploaded before this resolves).
 */
export async function createProduct(values: ProductFormValues): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('products')
    .insert(toProductRow(values))
    .select('id')
    .single()
  if (error) throw error
  return { id: data.id }
}
