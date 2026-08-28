import { supabase } from '@/lib/supabase'
import type { ProductFormValues } from '@/features/products/schemas/product-schema'
import { toProductRow } from '@/features/products/api/product-row'

export async function createProduct(values: ProductFormValues): Promise<void> {
  const { error } = await supabase.from('products').insert(toProductRow(values))
  if (error) throw error
}
