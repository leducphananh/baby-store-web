import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getImportReceipts } from '@/features/import-receipts/api/get-import-receipts'
import { importReceiptKeys } from '@/features/import-receipts/api/query-keys'
import type { ImportReceiptFilters } from '@/features/import-receipts/types/import-receipt'

export function useImportReceipts(filters: ImportReceiptFilters) {
  return useQuery({
    queryKey: importReceiptKeys.list(filters),
    queryFn: () => getImportReceipts(filters),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
