import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteImportReceiptItem } from '@/features/import-receipts/api/delete-import-receipt-item'
import { importReceiptKeys } from '@/features/import-receipts/api/query-keys'
import { getImportReceiptLineErrorMessage } from '@/features/import-receipts/utils/get-import-receipt-line-error-message'

export function useDeleteImportReceiptItem(receiptId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteImportReceiptItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: importReceiptKeys.lines(receiptId) })
      void queryClient.invalidateQueries({ queryKey: importReceiptKeys.detail(receiptId) })
      toast.success('Đã xóa dòng hàng')
    },
    onError: (error) => {
      toast.error(getImportReceiptLineErrorMessage(error))
    },
  })
}
