import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { searchProducts } from '@/features/products/api/search-products'
import { productKeys } from '@/features/products/api/query-keys'

/** Debounce the `query` string before passing it here (see `use-debounced-value`). */
export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: productKeys.search(query),
    queryFn: () => searchProducts(query),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}
