import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useAuth } from '@/providers/auth-provider'
import { createPurchaseInvoice } from '@/features/purchase-invoices/api/create-purchase-invoice'
import { purchaseInvoiceKeys } from '@/features/purchase-invoices/api/query-keys'
import { getPurchaseInvoiceErrorMessage } from '@/features/purchase-invoices/utils/get-purchase-invoice-error-message'
import type { PurchaseInvoiceFormValues } from '@/features/purchase-invoices/schemas/purchase-invoice-schema'

export function useCreatePurchaseInvoice(importReceiptId: string) {
  const queryClient = useQueryClient()
  const auth = useAuth()
  const createdBy = auth.status === 'authenticated' ? auth.user.id : null

  return useMutation({
    mutationFn: (values: PurchaseInvoiceFormValues) =>
      createPurchaseInvoice({ ...values, importReceiptId, createdBy }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: purchaseInvoiceKeys.listByReceipt(importReceiptId),
      })
      toast.success('Đã thêm hóa đơn')
    },
    onError: (error) => {
      toast.error(getPurchaseInvoiceErrorMessage(error, 'create'))
    },
  })
}
