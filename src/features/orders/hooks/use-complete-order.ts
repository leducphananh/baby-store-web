import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { completeOrder } from '@/features/orders/api/complete-order'
import { orderKeys } from '@/features/orders/api/query-keys'
import { getCompleteOrderErrorMessage } from '@/features/orders/utils/get-complete-order-error-message'

export function useCompleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: completeOrder,
    onSuccess: (_result, orderId) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      void queryClient.invalidateQueries({ queryKey: orderKeys.lines(orderId) })
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      toast.success('Đã hoàn thành đơn hàng.')
    },
    onError: (error) => {
      toast.error(getCompleteOrderErrorMessage(error))
    },
  })
}
