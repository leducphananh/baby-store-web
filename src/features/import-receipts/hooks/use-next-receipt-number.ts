import { useQuery } from '@tanstack/react-query'

import { getNextReceiptNumber } from '@/features/import-receipts/api/get-next-receipt-number'
import { importReceiptKeys } from '@/features/import-receipts/api/query-keys'

/**
 * Suggested `REC-NNN` for a new receipt. `enabled` gates it to when the
 * create form is actually open; `staleTime: 0` so each fresh open re-checks.
 */
export function useNextReceiptNumber(enabled: boolean) {
  return useQuery({
    queryKey: importReceiptKeys.nextNumber(),
    queryFn: getNextReceiptNumber,
    enabled,
    staleTime: 0,
    gcTime: 0,
  })
}
