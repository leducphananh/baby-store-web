import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useAuth } from '@/providers/auth-provider'
import { createImportReceipt } from '@/features/import-receipts/api/create-import-receipt'
import { importReceiptKeys } from '@/features/import-receipts/api/query-keys'
import { getImportReceiptErrorMessage } from '@/features/import-receipts/utils/get-import-receipt-error-message'
import type { ImportReceiptFormValues } from '@/features/import-receipts/schemas/import-receipt-schema'

export function useCreateImportReceipt() {
  const queryClient = useQueryClient()
  const auth = useAuth()
  const createdBy = auth.status === 'authenticated' ? auth.user.id : null

  return useMutation({
    mutationFn: (values: ImportReceiptFormValues) =>
      createImportReceipt({ ...values, createdBy }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: importReceiptKeys.lists() })
      toast.success('Đã tạo phiếu nhập (nháp)')
    },
    onError: (error) => {
      toast.error(getImportReceiptErrorMessage(error, 'create'))
    },
  })
}
