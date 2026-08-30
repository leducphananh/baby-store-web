import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { searchProducts, type ProductSearchOptions } from '@/features/products/api/search-products'
import { productKeys } from '@/features/products/api/query-keys'

/** Debounce the `query` string before passing it here (see `use-debounced-value`). */
export function useSearchProducts(query: string, options: ProductSearchOptions = {}) {
  return useQuery({
    queryKey: productKeys.search(query, options),
    queryFn: () => searchProducts(query, options),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}
