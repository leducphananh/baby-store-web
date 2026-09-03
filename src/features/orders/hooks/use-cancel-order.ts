import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cancelOrder } from '@/features/orders/api/cancel-order'
import { orderKeys } from '@/features/orders/api/query-keys'
import { getCancelOrderErrorMessage } from '@/features/orders/utils/get-cancel-order-error-message'
import { inventoryOverviewKeys, inventoryTransactionKeys } from '@/features/inventory/api/query-keys'
import { productKeys } from '@/features/products/api/query-keys'
import { reportsKeys } from '@/features/reports/api/query-keys'

/**
 * Cancels a **completed** order and reverses its real inventory deduction
 * (see `cancel-order.ts`). On success, invalidates everything the reversal
 * can affect — same reasoning/scope as `useCreateOrder`, since cancelling
 * is the exact inverse operation: the order itself, that customer's
 * purchase history *and* completed-order summary (their `total_spent` just
 * dropped — `customer_order_summary` only counts `completed` orders, and
 * this order no longer is one), and every stock-derived view (products,
 * inventory dashboard, transaction ledger).
 */
export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { id: string; customerId: string | null }) => cancelOrder(variables.id),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) })
      void queryClient.invalidateQueries({ queryKey: orderKeys.lines(variables.id) })
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      if (variables.customerId) {
        void queryClient.invalidateQueries({ queryKey: orderKeys.byCustomer(variables.customerId) })
        void queryClient.invalidateQueries({ queryKey: orderKeys.customerSummary(variables.customerId) })
      }
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
      void queryClient.invalidateQueries({ queryKey: inventoryOverviewKeys.all })
      void queryClient.invalidateQueries({ queryKey: inventoryTransactionKeys.lists() })
      // This order was `completed` (only a completed order can be
      // cancelled) and just stopped being reportable revenue/COGS — every
      // report query may now be stale (see `use-create-order.ts` for why
      // this invalidates the whole `reportsKeys.all` space, not just
      // `.revenue()`).
      void queryClient.invalidateQueries({ queryKey: reportsKeys.all })
      toast.success('Đã hủy đơn hàng và hoàn trả tồn kho.')
    },
    onError: (error) => {
      toast.error(getCancelOrderErrorMessage(error))
    },
  })
}
