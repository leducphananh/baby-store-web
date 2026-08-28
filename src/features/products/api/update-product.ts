import { supabase } from '@/lib/supabase'
import type { ProductFormValues } from '@/features/products/schemas/product-schema'
import { toProductRow } from '@/features/products/api/product-row'

export async function updateProduct({
  id,
  values,
}: {
  id: string
  values: ProductFormValues
}): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ ...toProductRow(values), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
