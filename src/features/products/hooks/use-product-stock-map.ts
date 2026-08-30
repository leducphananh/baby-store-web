import { useQuery } from '@tanstack/react-query'

import { getStockByProduct } from '@/features/products/api/search-products'
import { productKeys } from '@/features/products/api/query-keys'

/**
 * Live sellable (non-expired) stock for a known list of product ids — used
 * by Edit Order to re-check each existing line's `availableQuantity`
 * against *current* reality, not a stale snapshot from whenever the order
 * was first built (see `getStockByProduct`).
 */
export function useProductStockMap(productIds: string[]) {
  return useQuery({
    queryKey: productKeys.stockMap(productIds),
    queryFn: () => getStockByProduct(productIds, true),
    enabled: productIds.length > 0,
  })
}
