import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updatePurchaseInvoice } from '@/features/purchase-invoices/api/update-purchase-invoice'
import { purchaseInvoiceKeys } from '@/features/purchase-invoices/api/query-keys'
import { getPurchaseInvoiceErrorMessage } from '@/features/purchase-invoices/utils/get-purchase-invoice-error-message'

export function useUpdatePurchaseInvoice(importReceiptId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updatePurchaseInvoice,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: purchaseInvoiceKeys.listByReceipt(importReceiptId),
      })
      toast.success('Đã cập nhật hóa đơn')
    },
    onError: (error) => {
      toast.error(getPurchaseInvoiceErrorMessage(error, 'update'))
    },
  })
}
