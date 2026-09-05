import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getInventoryProductList } from '@/features/reports/api/get-inventory-product-list'
import { reportsKeys } from '@/features/reports/api/query-keys'
import type { InventoryReportFilters } from '@/features/reports/types/inventory'

/**
 * Paginated/sorted/filtered current inventory table data. Same
 * `keepPreviousData` convention as `useProducts`/`useProductPerformanceList`
 * — filter/sort/page state is part of the query key, and the page itself
 * dims the table via `isFetching` while a refetch is in flight so a still-
 * displayed page is never mistaken for the new filter's result.
 */
export function useInventoryProductList(filters: InventoryReportFilters) {
  return useQuery({
    queryKey: reportsKeys.inventoryProductList(filters),
    queryFn: () => getInventoryProductList(filters),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
