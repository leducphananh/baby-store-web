import { supabase } from '@/lib/supabase'
import type { CategoryFormValues } from '@/features/categories/schemas/category-schema'

export async function updateCategory({
  id,
  values,
}: {
  id: string
  values: CategoryFormValues
}): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({
      name: values.name,
      description: values.description ? values.description : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}
