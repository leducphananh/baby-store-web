import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getProducts } from '@/features/products/api/get-products'
import { productKeys } from '@/features/products/api/query-keys'
import type { ProductFilters } from '@/features/products/types/product'

/**
 * Server-driven product list. Filter/sort/pagination state is the query key
 * (see `react-query` rule 9), so each combination caches independently;
 * `keepPreviousData` keeps the current rows visible while the next page or
 * filter loads instead of flashing a skeleton on every change.
 */
export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => getProducts(filters),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
