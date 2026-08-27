import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import type { Category, CategoryFilters } from '@/features/categories/types/category'

type CategoryRow = Tables<'categories'>

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export type CategoriesPage = {
  data: Category[]
  total: number
}

/**
 * Server-driven list query: search, sort, and pagination all happen in
 * Postgres (`.ilike`, `.order`, `.range`) — the client never downloads the
 * whole table (see `table-data-grid`, `supabase-database`). `count: 'exact'`
 * gives the total for pagination controls in the same round trip.
 */
export async function getCategories(filters: CategoryFilters): Promise<CategoriesPage> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase.from('categories').select('*', { count: 'exact' })

  if (filters.search.trim()) {
    query = query.ilike('name', `%${filters.search.trim()}%`)
  }

  query = query.order(filters.sortField, { ascending: !filters.sortDesc }).range(from, to)

  const { data, error, count } = await query
  if (error) throw error

  return { data: data.map(toCategory), total: count ?? 0 }
}
