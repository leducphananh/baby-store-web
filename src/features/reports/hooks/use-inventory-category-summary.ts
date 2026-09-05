import { useQuery } from '@tanstack/react-query'

import { getInventoryCategorySummary } from '@/features/reports/api/get-inventory-category-summary'
import { reportsKeys } from '@/features/reports/api/query-keys'

/** Category-level current inventory valuation, backing the category chart + table. */
export function useInventoryCategorySummary() {
  return useQuery({
    queryKey: reportsKeys.inventoryCategorySummary(),
    queryFn: getInventoryCategorySummary,
    staleTime: 30 * 1000,
  })
}
