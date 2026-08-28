import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteProduct } from '@/features/products/api/delete-product'
import { productKeys } from '@/features/products/api/query-keys'
import { getProductErrorMessage } from '@/features/products/utils/get-product-error-message'

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Đã xóa sản phẩm')
    },
    onError: (error) => {
      toast.error(getProductErrorMessage(error, 'delete'))
    },
  })
}
