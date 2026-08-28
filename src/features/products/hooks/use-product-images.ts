import { useQuery } from '@tanstack/react-query'

import { getProductImages } from '@/features/products/api/get-product-images'
import { productKeys } from '@/features/products/api/query-keys'

export function useProductImages(productId: string | undefined) {
  return useQuery({
    queryKey: productKeys.images(productId ?? ''),
    queryFn: () => getProductImages(productId as string),
    enabled: Boolean(productId),
    // Signed URLs live for an hour; refetch well before they expire.
    staleTime: 30 * 60 * 1000,
  })
}
