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
 * On success, invalidates every view whose numbers this can change:
 *
 * - `productKeys.all` — Product Detail's own batch table
 *   (`productKeys.batches(id)` nests under this) and any product list/stock
 *   display.
 * - `inventoryOverviewKeys.all` — the Phase 4.6 Inventory Dashboard.
 * - `inventoryTransactionKeys.lists()` — the transaction ledger view now
 *   has one more row.
 * - `reportsKeys.inventory()` + `reportsKeys.expiryReport()` — the
 *   Inventory Report, the Expiry & Slow-moving Report, AND both
 *   alert-condition RPCs (`reportsKeys.inventoryAlertConditions()` /
 *   `reportsKeys.expiryAlertConditions()` nest under these), which the
 *   Bell/Alert Center/Dashboard-Attention read through. A stock adjustment
 *   changes on-hand quantity and expiry-risk exposure only — it does NOT
 *   touch historical sales, so Revenue/Profit/Product-Performance/
 *   Category-Performance (snapshots of completed orders) stay valid and
 *   are deliberately left cached. This is the same stock-only targeting
 *   `use-confirm-import-receipt.ts` uses; the earlier `reportsKeys.all`
 *   here also refetched the sales reports on every write-off, which was
 *   wasted network work (Phase 9.2, requirement §17).
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
      void queryClient.invalidateQueries({ queryKey: reportsKeys.inventory() })
      void queryClient.invalidateQueries({ queryKey: reportsKeys.expiryReport() })

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
