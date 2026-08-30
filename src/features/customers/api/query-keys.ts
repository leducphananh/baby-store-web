import type { CustomerFilters } from '@/features/customers/types/customer'

/** Same convention as `supplierKeys` (see `react-query`). */
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: CustomerFilters) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  /** Lean search-as-you-type results for pickers (see `search-customers.ts`). */
  search: (query: string) => [...customerKeys.all, 'search', query] as const,
}
