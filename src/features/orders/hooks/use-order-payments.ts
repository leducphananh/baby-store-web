import { useQuery } from '@tanstack/react-query'

import { getOrderPayments } from '@/features/orders/api/get-order-payments'
import { orderKeys } from '@/features/orders/api/query-keys'

export function useOrderPayments(orderId: string) {
  return useQuery({
    queryKey: orderKeys.payments(orderId),
    queryFn: () => getOrderPayments(orderId),
    enabled: Boolean(orderId),
  })
}
