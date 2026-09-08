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
      // Phase 9.8 (Debt C): `options()` is a sibling key, not under `lists()`,
      // so it wasn't being refreshed — a supplier created here stayed missing
      // from the Import Receipt form's supplier dropdown (`useAllSuppliers`)
      // for up to its 5-minute staleTime. staleTime is unchanged.
      void queryClient.invalidateQueries({ queryKey: supplierKeys.options() })
      toast.success('Đã thêm nhà cung cấp mới')
    },
    onError: (error) => {
      toast.error(getSupplierErrorMessage(error, 'create'))
    },
  })
}
