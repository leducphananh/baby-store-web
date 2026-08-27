import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createSupplier } from '@/features/suppliers/api/create-supplier'
import { supplierKeys } from '@/features/suppliers/api/query-keys'
import { getSupplierErrorMessage } from '@/features/suppliers/utils/get-supplier-error-message'

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
      toast.success('Đã thêm nhà cung cấp mới')
    },
    onError: (error) => {
      toast.error(getSupplierErrorMessage(error, 'create'))
    },
  })
}
