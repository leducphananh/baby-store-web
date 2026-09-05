import { useQuery } from '@tanstack/react-query'

import { getInventoryAlertConditions } from '@/features/reports/api/get-inventory-alert-conditions'
import { reportsKeys } from '@/features/reports/api/query-keys'

/**
 * Current out_of_stock/low_stock alert occurrence data (Phase 8.2) — a
 * current-state snapshot like `useInventoryValueSummary`, no date range.
 * This is what `useOperationalAlerts` uses for these two alert types
 * specifically (lighter than the full valuation summary, and carries an
 * entity-aware fingerprint); the Inventory Report page keeps using
 * `useInventoryValueSummary` for its own KPI cards (total value, units,
 * products in stock) — unaffected by this hook.
 */
export function useInventoryAlertConditions() {
  return useQuery({
    queryKey: reportsKeys.inventoryAlertConditions(),
    queryFn: getInventoryAlertConditions,
    staleTime: 30 * 1000,
  })
}
