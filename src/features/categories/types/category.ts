/**
 * Domain model for `public.categories`. Nullability matches the actual
 * schema (no `status`/active flag exists on this table — see
 * `supabase-database`: never invent a frontend-only field).
 */
export type Category = {
  id: string
  name: string
  description: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type CategorySortField = 'name' | 'created_at'

export type CategoryFilters = {
  search: string
  page: number
  pageSize: number
  sortField: CategorySortField
  sortDesc: boolean
}
