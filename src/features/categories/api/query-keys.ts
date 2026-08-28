import type { CategoryFilters } from '@/features/categories/types/category'

/** Query key factory (see `react-query`) — establishes the app-wide convention. */
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters: CategoryFilters) => [...categoryKeys.lists(), filters] as const,
  /** The full, unpaginated lookup list — used by other features' selects/filters. */
  options: () => [...categoryKeys.all, 'options'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
}
