import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deletePurchaseInvoiceFile } from '@/features/purchase-invoices/api/delete-purchase-invoice-file'
import { purchaseInvoiceKeys } from '@/features/purchase-invoices/api/query-keys'
import { getInvoiceFileErrorMessage } from '@/features/purchase-invoices/utils/get-purchase-invoice-error-message'
import type { PurchaseInvoiceFile } from '@/features/purchase-invoices/types/purchase-invoice'

export function useDeletePurchaseInvoiceFile(importReceiptId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: Pick<PurchaseInvoiceFile, 'id' | 'storagePath'>) =>
      deletePurchaseInvoiceFile(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: purchaseInvoiceKeys.listByReceipt(importReceiptId),
      })
      toast.success('Đã xóa tệp đính kèm')
    },
    onError: (error) => {
      toast.error(getInvoiceFileErrorMessage(error, 'delete'))
    },
  })
}
