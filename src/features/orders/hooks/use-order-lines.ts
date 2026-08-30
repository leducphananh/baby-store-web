import { useQuery } from '@tanstack/react-query'

import { getOrderLines } from '@/features/orders/api/get-order-lines'
import { orderKeys } from '@/features/orders/api/query-keys'

export function useOrderLines(orderId: string) {
  return useQuery({
    queryKey: orderKeys.lines(orderId),
    queryFn: () => getOrderLines(orderId),
    enabled: Boolean(orderId),
  })
}
