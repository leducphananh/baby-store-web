import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deletePurchaseInvoice } from '@/features/purchase-invoices/api/delete-purchase-invoice'
import { purchaseInvoiceKeys } from '@/features/purchase-invoices/api/query-keys'
import { getPurchaseInvoiceErrorMessage } from '@/features/purchase-invoices/utils/get-purchase-invoice-error-message'

export function useDeletePurchaseInvoice(importReceiptId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoiceId: string) => deletePurchaseInvoice(invoiceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: purchaseInvoiceKeys.listByReceipt(importReceiptId),
      })
      toast.success('Đã xóa hóa đơn')
    },
    onError: (error) => {
      toast.error(getPurchaseInvoiceErrorMessage(error, 'delete'))
    },
  })
}
