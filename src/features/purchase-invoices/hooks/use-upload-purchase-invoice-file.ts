import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useAuth } from '@/providers/auth-provider'
import { uploadPurchaseInvoiceFile } from '@/features/purchase-invoices/api/upload-purchase-invoice-file'
import { purchaseInvoiceKeys } from '@/features/purchase-invoices/api/query-keys'
import { getInvoiceFileErrorMessage } from '@/features/purchase-invoices/utils/get-purchase-invoice-error-message'

/**
 * Upload one attachment for a given invoice. The caller uploads files
 * sequentially for clear per-file feedback, so the success toast is left to
 * the caller (one summary beats N).
 */
export function useUploadPurchaseInvoiceFile({
  importReceiptId,
  purchaseInvoiceId,
}: {
  importReceiptId: string
  purchaseInvoiceId: string
}) {
  const queryClient = useQueryClient()
  const auth = useAuth()
  const createdBy = auth.status === 'authenticated' ? auth.user.id : null

  return useMutation({
    mutationFn: (file: File) =>
      uploadPurchaseInvoiceFile({ purchaseInvoiceId, importReceiptId, file, createdBy }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: purchaseInvoiceKeys.listByReceipt(importReceiptId),
      })
    },
    onError: (error) => {
      toast.error(getInvoiceFileErrorMessage(error, 'upload'))
    },
  })
}
