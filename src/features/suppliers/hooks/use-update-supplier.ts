import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateSupplier } from '@/features/suppliers/api/update-supplier'
import { supplierKeys } from '@/features/suppliers/api/query-keys'
import { getSupplierErrorMessage } from '@/features/suppliers/utils/get-supplier-error-message'

export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSupplier,
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) })
      toast.success('Đã cập nhật nhà cung cấp')
    },
    onError: (error) => {
      toast.error(getSupplierErrorMessage(error, 'update'))
    },
  })
}
