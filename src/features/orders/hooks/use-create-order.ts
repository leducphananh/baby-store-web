import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createOrder } from '@/features/orders/api/create-order'
import { orderKeys } from '@/features/orders/api/query-keys'
import { inventoryOverviewKeys, inventoryTransactionKeys } from '@/features/inventory/api/query-keys'
import { productKeys } from '@/features/products/api/query-keys'
import { reportsKeys } from '@/features/reports/api/query-keys'

/**
 * Creates and immediately completes an order (see `create-order.ts`). On
 * success, invalidates every query the sale can affect: the order list,
 * that customer's purchase history/summary (if one was picked), and every
 * stock-derived view (product list/details, the inventory dashboard, the
 * transaction ledger) — same invalidation-scope reasoning as
 * `useConfirmImportReceipt`, since one order can touch several products at
 * once and the RPC doesn't report back which ones.
 *
 * Toasting and navigation are left to the caller (the create-order page),
 * since only it knows where to navigate on success.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrder,
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      if (variables.customerId) {
        void queryClient.invalidateQueries({ queryKey: orderKeys.byCustomer(variables.customerId) })
        void queryClient.invalidateQueries({ queryKey: orderKeys.customerSummary(variables.customerId) })
      }
      // The whole `products` key space, not just `.lists()`/`.details()` —
      // this also covers `.search()` (see `search-products.ts`), so a
      // product's search-picker stock figure can't stay stale for up to
      // 30s (its `staleTime`) right after selling the last of it.
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
      void queryClient.invalidateQueries({ queryKey: inventoryOverviewKeys.all })
      void queryClient.invalidateQueries({ queryKey: inventoryTransactionKeys.lists() })
      // This RPC creates AND immediately completes the order (see
      // `create-order.ts`) — a brand new completed order, so every Revenue
      // Report query (any date range) may now be stale.
      void queryClient.invalidateQueries({ queryKey: reportsKeys.revenue() })
    },
  })
}
