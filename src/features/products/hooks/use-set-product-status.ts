import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { setProductStatus } from '@/features/products/api/set-product-status'
import { productKeys } from '@/features/products/api/query-keys'
import { getProductErrorMessage } from '@/features/products/utils/get-product-error-message'

export function useSetProductStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setProductStatus,
    onSuccess: (_data, { id, status }) => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: productKeys.detail(id) })
      toast.success(
        status === 'archived' ? 'Đã chuyển sản phẩm sang "Ngừng kinh doanh"' : 'Đã kinh doanh lại sản phẩm',
      )
    },
    onError: (error) => {
      toast.error(getProductErrorMessage(error, 'status'))
    },
  })
}
