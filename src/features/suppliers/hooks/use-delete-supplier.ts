import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteSupplier } from '@/features/suppliers/api/delete-supplier'
import { supplierKeys } from '@/features/suppliers/api/query-keys'
import { getSupplierErrorMessage } from '@/features/suppliers/utils/get-supplier-error-message'

export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
      // Phase 9.8 (Debt C): also refresh the lookup list feeding other
      // features' dropdowns so a deleted supplier stops appearing there.
      void queryClient.invalidateQueries({ queryKey: supplierKeys.options() })
      toast.success('Đã xóa nhà cung cấp')
    },
    onError: (error) => {
      toast.error(getSupplierErrorMessage(error, 'delete'))
    },
  })
}
