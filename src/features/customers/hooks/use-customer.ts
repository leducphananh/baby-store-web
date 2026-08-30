import { useQuery } from '@tanstack/react-query'

import { getCustomer } from '@/features/customers/api/get-customer'
import { customerKeys } from '@/features/customers/api/query-keys'

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ''),
    queryFn: () => getCustomer(id as string),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  })
}
