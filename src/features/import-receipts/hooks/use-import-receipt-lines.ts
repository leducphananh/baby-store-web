import { useQuery } from '@tanstack/react-query'

import { getImportReceiptLines } from '@/features/import-receipts/api/get-import-receipt-lines'
import { importReceiptKeys } from '@/features/import-receipts/api/query-keys'

export function useImportReceiptLines(receiptId: string | undefined) {
  return useQuery({
    queryKey: importReceiptKeys.lines(receiptId ?? ''),
    queryFn: () => getImportReceiptLines(receiptId as string),
    enabled: Boolean(receiptId),
    staleTime: 30 * 1000,
  })
}
