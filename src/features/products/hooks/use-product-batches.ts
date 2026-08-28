import { useQuery } from '@tanstack/react-query'

import { getProductBatches } from '@/features/products/api/get-product-batches'
import { productKeys } from '@/features/products/api/query-keys'

export function useProductBatches(productId: string | undefined) {
  return useQuery({
    queryKey: productKeys.batches(productId ?? ''),
    queryFn: () => getProductBatches(productId as string),
    enabled: Boolean(productId),
    // Stock moves more often than the product record itself.
    staleTime: 15 * 1000,
  })
}
