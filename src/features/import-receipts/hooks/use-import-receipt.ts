import { useQuery } from '@tanstack/react-query'

import { getImportReceipt } from '@/features/import-receipts/api/get-import-receipt'
import { importReceiptKeys } from '@/features/import-receipts/api/query-keys'

export function useImportReceipt(id: string | undefined) {
  return useQuery({
    queryKey: importReceiptKeys.detail(id ?? ''),
    queryFn: () => getImportReceipt(id as string),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  })
}
