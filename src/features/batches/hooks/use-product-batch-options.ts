import { useQuery } from '@tanstack/react-query'

import { getProductBatchOptions } from '@/features/batches/api/get-product-batch-options'
import { batchKeys } from '@/features/batches/api/query-keys'

export function useProductBatchOptions(productId: string | null | undefined) {
  return useQuery({
    queryKey: batchKeys.optionsByProduct(productId ?? ''),
    queryFn: () => getProductBatchOptions(productId as string),
    enabled: Boolean(productId),
    staleTime: 60 * 1000,
  })
}
