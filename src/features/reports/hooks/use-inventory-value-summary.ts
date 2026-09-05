import { useQuery } from '@tanstack/react-query'

import { getInventoryValueSummary } from '@/features/reports/api/get-inventory-value-summary'
import { reportsKeys } from '@/features/reports/api/query-keys'

/**
 * Current inventory valuation KPIs — no `enabled`/date-range gate, unlike
 * every other report hook (this is a snapshot, not a sales-period query,
 * requirement §2). Refetches after any inventory-affecting mutation via
 * targeted invalidation (`use-confirm-import-receipt.ts`,
 * `use-create-order.ts`, `use-cancel-order.ts` — see `reportsKeys.all`),
 * not polling/realtime (requirement §63).
 */
export function useInventoryValueSummary() {
  return useQuery({
    queryKey: reportsKeys.inventorySummary(),
    queryFn: getInventoryValueSummary,
    staleTime: 30 * 1000,
  })
}
