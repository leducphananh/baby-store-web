import { supabase } from '@/lib/supabase'
import type { Category } from '@/features/categories/types/category'

/**
 * The whole categories table as a flat, name-sorted list — for populating
 * `<Select>` options and list filters in other features (products, imports).
 * The catalog has at most a few dozen categories (see `use-categories.ts`),
 * so fetching all of them once and caching is cheaper than paginating a
 * dropdown. List *views* still use the paginated `getCategories`.
 */
export async function getAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, description, created_at, updated_at')
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}
