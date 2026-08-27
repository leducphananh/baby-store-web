import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getCategories } from '@/features/categories/api/get-categories'
import { categoryKeys } from '@/features/categories/api/query-keys'
import type { CategoryFilters } from '@/features/categories/types/category'

/**
 * Categories is a small, bounded lookup table today (a few dozen rows) but
 * is server-paginated/searched/sorted from the start anyway (see
 * `table-data-grid` rule 2/3) — this establishes the pattern every larger
 * module (products, orders, ...) reuses unchanged.
 */
export function useCategories(filters: CategoryFilters) {
  return useQuery({
    queryKey: categoryKeys.list(filters),
    queryFn: () => getCategories(filters),
    // Categories change rarely; avoid refetching on every focus while the
    // user is mid-edit in another tab of the same session.
    staleTime: 30 * 1000,
    // Keep showing the current page's rows while a new page/search/sort is
    // loading, instead of flashing a full loading state on every filter
    // change — only the very first load has no data to fall back to.
    placeholderData: keepPreviousData,
  })
}
