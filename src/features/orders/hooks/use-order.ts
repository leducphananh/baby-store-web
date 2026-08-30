import { useQuery } from '@tanstack/react-query'

import { getOrder } from '@/features/orders/api/get-order'
import { orderKeys } from '@/features/orders/api/query-keys'

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: () => getOrder(id ?? ''),
    enabled: Boolean(id),
  })
}
