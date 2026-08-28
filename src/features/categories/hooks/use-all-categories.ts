import { useQuery } from '@tanstack/react-query'

import { getAllCategories } from '@/features/categories/api/get-all-categories'
import { categoryKeys } from '@/features/categories/api/query-keys'

/**
 * Full category lookup list for selects/filters in other features. Rarely
 * changes, so a long `staleTime` keeps dropdowns from refetching mid-form.
 */
export function useAllCategories() {
  return useQuery({
    queryKey: categoryKeys.options(),
    queryFn: getAllCategories,
    staleTime: 5 * 60 * 1000,
  })
}
