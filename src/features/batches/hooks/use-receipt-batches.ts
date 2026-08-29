import { useQuery } from '@tanstack/react-query'

import { getReceiptBatches } from '@/features/batches/api/get-receipt-batches'
import { batchKeys } from '@/features/batches/api/query-keys'

export function useReceiptBatches(receiptId: string | undefined) {
  return useQuery({
    queryKey: batchKeys.byReceipt(receiptId ?? ''),
    queryFn: () => getReceiptBatches(receiptId as string),
    enabled: Boolean(receiptId),
    // Stock (remaining_quantity) moves more often than the receipt itself.
    staleTime: 15 * 1000,
  })
}
