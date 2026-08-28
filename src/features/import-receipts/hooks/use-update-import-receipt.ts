import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateImportReceipt } from '@/features/import-receipts/api/update-import-receipt'
import { importReceiptKeys } from '@/features/import-receipts/api/query-keys'
import { getImportReceiptErrorMessage } from '@/features/import-receipts/utils/get-import-receipt-error-message'

export function useUpdateImportReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateImportReceipt,
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: importReceiptKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: importReceiptKeys.detail(id) })
      toast.success('Đã cập nhật phiếu nhập')
    },
    onError: (error) => {
      toast.error(getImportReceiptErrorMessage(error, 'update'))
    },
  })
}
