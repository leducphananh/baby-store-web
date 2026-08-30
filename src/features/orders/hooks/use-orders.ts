import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getOrders } from '@/features/orders/api/get-orders'
import { orderKeys } from '@/features/orders/api/query-keys'
import type { OrdersFilters } from '@/features/orders/types/order'

export function useOrders(filters: OrdersFilters) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => getOrders(filters),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
