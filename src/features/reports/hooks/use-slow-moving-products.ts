import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getSlowMovingProducts } from '@/features/reports/api/get-slow-moving-products'
import { reportsKeys } from '@/features/reports/api/query-keys'
import type { SlowMovingFilters } from '@/features/reports/types/expiry'

/** Paginated/sorted/filtered factual current-inventory + recent-sales table data. */
export function useSlowMovingProducts(filters: SlowMovingFilters) {
  return useQuery({
    queryKey: reportsKeys.slowMovingProducts(filters),
    queryFn: () => getSlowMovingProducts(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
