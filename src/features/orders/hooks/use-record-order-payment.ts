import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { recordOrderPayment } from '@/features/orders/api/record-order-payment'
import { orderKeys } from '@/features/orders/api/query-keys'
import { getRecordOrderPaymentErrorMessage } from '@/features/orders/utils/get-record-order-payment-error-message'

/**
 * Records a payment (see `record-order-payment.ts`). Invalidates the
 * order's own detail (its `payment_status` just changed) and payments list,
 * plus the store-wide order list (its "Thanh toán" badge column reads
 * `payment_status` too) and, if the order has a customer, their purchase
 * history view.
 */
export function useRecordOrderPayment(orderId: string, customerId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recordOrderPayment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      void queryClient.invalidateQueries({ queryKey: orderKeys.payments(orderId) })
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      if (customerId) {
        void queryClient.invalidateQueries({ queryKey: orderKeys.byCustomer(customerId) })
      }
      toast.success('Đã ghi nhận thanh toán.')
    },
    onError: (error) => {
      toast.error(getRecordOrderPaymentErrorMessage(error))
    },
  })
}
