import { supabase } from '@/lib/supabase'
import type { CategoryFormValues } from '@/features/categories/schemas/category-schema'

export async function createCategory(values: CategoryFormValues): Promise<void> {
  const { error } = await supabase.from('categories').insert({
    name: values.name,
    description: values.description ? values.description : null,
  })
  if (error) throw error
}
