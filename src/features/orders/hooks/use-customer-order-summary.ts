import { useQuery } from '@tanstack/react-query'

import { getCustomerOrderSummary } from '@/features/orders/api/get-customer-order-summary'
import { orderKeys } from '@/features/orders/api/query-keys'

export function useCustomerOrderSummary(customerId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.customerSummary(customerId ?? ''),
    queryFn: () => getCustomerOrderSummary(customerId as string),
    enabled: Boolean(customerId),
    staleTime: 30 * 1000,
  })
}
