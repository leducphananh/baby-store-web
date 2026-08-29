import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getInventoryOverview } from '@/features/inventory/api/get-inventory-overview'
import { inventoryOverviewKeys } from '@/features/inventory/api/query-keys'
import type { InventoryOverviewFilters } from '@/features/inventory/types/inventory-overview'

/**
 * Server-driven inventory table. Filter/sort/pagination state is the query
 * key (see `react-query` rule 9); `keepPreviousData` keeps the current rows
 * visible while the next page/filter loads instead of flashing a skeleton.
 */
export function useInventoryOverview(filters: InventoryOverviewFilters) {
  return useQuery({
    queryKey: inventoryOverviewKeys.list(filters),
    queryFn: () => getInventoryOverview(filters),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
