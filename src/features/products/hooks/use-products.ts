import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getProducts } from '@/features/products/api/get-products'
import { productKeys } from '@/features/products/api/query-keys'
import type { ProductFilters } from '@/features/products/types/product'

/**
 * Server-driven product list. Filter/sort/pagination state is the query key
 * (see `react-query` rule 9), so each combination caches independently;
 * `keepPreviousData` keeps the current rows visible while the next page or
 * filter loads instead of flashing a skeleton on every change.
 *
 * `staleTime` is longer than the global 30s default (`react-query` rule 10 —
 * override per-query when an entity needs different behavior): this list
 * carries one signed image URL per row, and every stale-triggered refetch
 * used to force a full re-download of every row's image (see
 * `signed-image-url-cache.ts` for the fix to that specifically). 2 minutes
 * comfortably survives normal tab-switching/window-focus churn during a
 * single working session, while `refetchOnWindowFocus` (global default)
 * still refetches once genuinely stale, and every product/inventory
 * mutation still explicitly invalidates `productKeys.lists()` regardless of
 * `staleTime` — a real change is never delayed by this.
 */
const PRODUCT_LIST_STALE_TIME_MS = 2 * 60 * 1000

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => getProducts(filters),
    staleTime: PRODUCT_LIST_STALE_TIME_MS,
    placeholderData: keepPreviousData,
  })
}
