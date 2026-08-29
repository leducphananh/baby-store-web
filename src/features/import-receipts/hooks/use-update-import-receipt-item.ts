import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateImportReceiptItem } from '@/features/import-receipts/api/update-import-receipt-item'
import { importReceiptKeys } from '@/features/import-receipts/api/query-keys'
import { getImportReceiptLineErrorMessage } from '@/features/import-receipts/utils/get-import-receipt-line-error-message'

export function useUpdateImportReceiptItem(receiptId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateImportReceiptItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: importReceiptKeys.lines(receiptId) })
      void queryClient.invalidateQueries({ queryKey: importReceiptKeys.detail(receiptId) })
      toast.success('Đã cập nhật dòng hàng')
    },
    onError: (error) => {
      toast.error(getImportReceiptLineErrorMessage(error))
    },
  })
}
