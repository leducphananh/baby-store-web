import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getCustomerOrders } from '@/features/orders/api/get-customer-orders'
import { orderKeys } from '@/features/orders/api/query-keys'
import type { CustomerOrdersFilters } from '@/features/orders/types/order'

export function useCustomerOrders(filters: CustomerOrdersFilters) {
  return useQuery({
    queryKey: orderKeys.byCustomerList(filters),
    queryFn: () => getCustomerOrders(filters),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
