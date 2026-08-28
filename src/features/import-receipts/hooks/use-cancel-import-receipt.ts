import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cancelImportReceipt } from '@/features/import-receipts/api/cancel-import-receipt'
import { importReceiptKeys } from '@/features/import-receipts/api/query-keys'
import { getImportReceiptErrorMessage } from '@/features/import-receipts/utils/get-import-receipt-error-message'

export function useCancelImportReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => cancelImportReceipt(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: importReceiptKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: importReceiptKeys.detail(id) })
      toast.success('Đã hủy phiếu nhập')
    },
    onError: (error) => {
      toast.error(getImportReceiptErrorMessage(error, 'cancel'))
    },
  })
}
