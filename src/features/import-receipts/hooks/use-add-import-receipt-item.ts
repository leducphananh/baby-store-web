import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { addImportReceiptItem } from '@/features/import-receipts/api/add-import-receipt-item'
import { importReceiptKeys } from '@/features/import-receipts/api/query-keys'
import { getImportReceiptLineErrorMessage } from '@/features/import-receipts/utils/get-import-receipt-line-error-message'

export function useAddImportReceiptItem(receiptId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addImportReceiptItem,
    onSuccess: () => {
      // The RPC already recomputed total_cost server-side; refetch both so
      // the line table and the header's "Tổng chi phí" read the real value
      // back, never a client-side guess (see `add-import-receipt-item.ts`).
      void queryClient.invalidateQueries({ queryKey: importReceiptKeys.lines(receiptId) })
      void queryClient.invalidateQueries({ queryKey: importReceiptKeys.detail(receiptId) })
      toast.success('Đã thêm sản phẩm vào phiếu nhập')
    },
    onError: (error) => {
      toast.error(getImportReceiptLineErrorMessage(error))
    },
  })
}
