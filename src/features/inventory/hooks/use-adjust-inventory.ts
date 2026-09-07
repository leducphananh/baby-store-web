import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adjustInventory } from '@/features/inventory/api/adjust-inventory'
import { inventoryOverviewKeys, inventoryTransactionKeys } from '@/features/inventory/api/query-keys'
import { getAdjustInventoryErrorMessage } from '@/features/inventory/utils/get-adjust-inventory-error-message'
import { productKeys } from '@/features/products/api/query-keys'
import { reportsKeys } from '@/features/reports/api/query-keys'
import { formatNumber } from '@/utils/number'
import type { AdjustInventoryInput } from '@/features/inventory/types/inventory-adjustment'

/**
 * The one mutation hook for Phase 8.4 manual inventory adjustment/write-off.
 * On success, invalidates every view whose numbers this can change — same
 * scope as `useCancelOrder`'s inventory-reversal invalidation, since a
 * batch quantity change is exactly the kind of thing all of these derive
 * from:
 *
 * - `productKeys.all` — Product Detail's own batch table
 *   (`productKeys.batches(id)` nests under this) and any product list/stock
 *   display.
 * - `inventoryOverviewKeys.all` — the Phase 4.6 Inventory Dashboard.
 * - `inventoryTransactionKeys.lists()` — the transaction ledger view now
 *   has one more row.
 * - `reportsKeys.all` — covers the Inventory Report, Expiry Report, AND
 *   both alert-condition RPCs (`reportsKeys.inventory()`/
 *   `reportsKeys.expiryReport()` nest under it) in one call; the Bell/Alert
 *   Center/Dashboard Attention all read through those same query keys, so
 *   no separate "patch the alert list" step is needed (requirement §119) —
 *   the next fetch re-derives conditions from the new database state, and
 *   `_advance_alert_occurrence()` updates the lifecycle exactly as it does
 *   for any other cause of the condition changing (requirement §117).
 *
 * No Realtime/polling — this invalidation is the whole refresh mechanism
 * (requirement §120), same as every other mutation in this app.
 */
export function useAdjustInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AdjustInventoryInput) => adjustInventory(input),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
      void queryClient.invalidateQueries({ queryKey: inventoryOverviewKeys.all })
      void queryClient.invalidateQueries({ queryKey: inventoryTransactionKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: reportsKeys.all })

      toast.success(
        result.delta < 0
          ? `Đã ghi nhận điều chỉnh: giảm ${formatNumber(Math.abs(result.delta))}, tồn còn ${formatNumber(result.newQuantity)}.`
          : `Đã ghi nhận điều chỉnh: tăng ${formatNumber(result.delta)}, tồn còn ${formatNumber(result.newQuantity)}.`,
      )
    },
    onError: (error) => {
      toast.error(getAdjustInventoryErrorMessage(error))
    },
  })
}
