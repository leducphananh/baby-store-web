import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { searchCustomers } from '@/features/customers/api/search-customers'
import { customerKeys } from '@/features/customers/api/query-keys'

/** Debounce the `query` string before passing it here (see `use-debounced-value`). */
export function useSearchCustomers(query: string) {
  return useQuery({
    queryKey: customerKeys.search(query),
    queryFn: () => searchCustomers(query),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}
