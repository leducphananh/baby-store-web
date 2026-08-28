import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateProduct } from '@/features/products/api/update-product'
import { productKeys } from '@/features/products/api/query-keys'
import { getProductErrorMessage } from '@/features/products/utils/get-product-error-message'

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: productKeys.detail(id) })
      toast.success('Đã cập nhật sản phẩm')
    },
    onError: (error) => {
      toast.error(getProductErrorMessage(error, 'update'))
    },
  })
}
