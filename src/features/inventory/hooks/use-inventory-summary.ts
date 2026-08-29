import { useQuery } from '@tanstack/react-query'

import { getInventorySummary } from '@/features/inventory/api/get-inventory-summary'
import { inventoryOverviewKeys } from '@/features/inventory/api/query-keys'

/**
 * Independent widget query for the alert cards (see `dashboard-ui` rule 1) —
 * fetched and cached separately from the table itself, so a slow/failed
 * table load never blocks the summary cards or vice versa.
 */
export function useInventorySummary() {
  return useQuery({
    queryKey: inventoryOverviewKeys.summary(),
    queryFn: getInventorySummary,
    staleTime: 30 * 1000,
  })
}
