import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getExpiryBatchList } from '@/features/reports/api/get-expiry-batch-list'
import { reportsKeys } from '@/features/reports/api/query-keys'
import type { ExpiryBatchFilters } from '@/features/reports/types/expiry'

/** Paginated/sorted/filtered batch-level expiry-risk table data. Same `keepPreviousData` convention as every other Phase 7.x filtered table. */
export function useExpiryBatchList(filters: ExpiryBatchFilters) {
  return useQuery({
    queryKey: reportsKeys.expiryBatchList(filters),
    queryFn: () => getExpiryBatchList(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
