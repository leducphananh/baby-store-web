import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateOrderDraft } from '@/features/orders/api/update-order-draft'
import { orderKeys } from '@/features/orders/api/query-keys'

/**
 * Edits a draft/confirmed order (see `update-order-draft.ts`). Invalidates
 * the order's own detail/lines, the store-wide list, and the (possibly new)
 * customer's purchase history. No `customer_order_summary` invalidation
 * needed — that view only aggregates `completed` orders, and a draft edit
 * can never touch one (see `react-query`).
 */
export function useUpdateOrderDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateOrderDraft,
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) })
      void queryClient.invalidateQueries({ queryKey: orderKeys.lines(variables.orderId) })
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      if (variables.customerId) {
        void queryClient.invalidateQueries({ queryKey: orderKeys.byCustomer(variables.customerId) })
      }
    },
  })
}
