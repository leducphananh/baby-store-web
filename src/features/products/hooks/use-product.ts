import { useQuery } from '@tanstack/react-query'

import { getProduct } from '@/features/products/api/get-product'
import { productKeys } from '@/features/products/api/query-keys'

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: () => getProduct(id as string),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  })
}
