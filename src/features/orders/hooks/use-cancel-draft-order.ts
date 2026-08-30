import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cancelDraftOrder } from '@/features/orders/api/cancel-draft-order'
import { orderKeys } from '@/features/orders/api/query-keys'
import { getCancelDraftOrderErrorMessage } from '@/features/orders/utils/get-cancel-draft-order-error-message'

/**
 * Cancels a draft/confirmed order — a plain status flip, no inventory to
 * restore (see `cancel-draft-order.ts`). Invalidation is narrow on purpose:
 * unlike `useCancelOrder`, nothing about stock, products, or a customer's
 * *completed*-order summary changes.
 */
export function useCancelDraftOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelDraftOrder,
    onSuccess: (_result, orderId) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      toast.success('Đã hủy đơn hàng nháp.')
    },
    onError: (error) => {
      toast.error(getCancelDraftOrderErrorMessage(error))
    },
  })
}
