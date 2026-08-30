import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getCustomers } from '@/features/customers/api/get-customers'
import { customerKeys } from '@/features/customers/api/query-keys'
import type { CustomerFilters } from '@/features/customers/types/customer'

export function useCustomers(filters: CustomerFilters) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => getCustomers(filters),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
