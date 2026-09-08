import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { recordOrderPayment } from '@/features/orders/api/record-order-payment'
import { orderKeys } from '@/features/orders/api/query-keys'
import { getRecordOrderPaymentErrorMessage } from '@/features/orders/utils/get-record-order-payment-error-message'
import { reportsKeys } from '@/features/reports/api/query-keys'

/**
 * Records a payment (see `record-order-payment.ts`). Invalidates the
 * order's own detail (its `payment_status` just changed) and payments list,
 * plus the store-wide order list (its "Thanh toán" badge column reads
 * `payment_status` too) and, if the order has a customer, their purchase
 * history view.
 *
 * Also `reportsKeys.revenue()`: the Revenue Report's "Đã thu" / "Còn phải
 * thu" KPIs are `SUM`s over `order_payments` for completed orders (see
 * `RevenueSummary`), so a new payment makes them stale. This was missing
 * before Phase 9.2 (requirement §16) — the scope stays exactly `revenue()`
 * because nothing else in reports reads payments: Profit is Revenue−COGS,
 * inventory/expiry/product-performance don't involve `order_payments` at
 * all.
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
      void queryClient.invalidateQueries({ queryKey: reportsKeys.revenue() })
      toast.success('Đã ghi nhận thanh toán.')
    },
    onError: (error) => {
      toast.error(getRecordOrderPaymentErrorMessage(error))
    },
  })
}
