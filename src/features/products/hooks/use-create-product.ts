import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createProduct } from '@/features/products/api/create-product'
import { productKeys } from '@/features/products/api/query-keys'
import { getProductErrorMessage } from '@/features/products/utils/get-product-error-message'

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Đã thêm sản phẩm mới')
    },
    onError: (error) => {
      toast.error(getProductErrorMessage(error, 'create'))
    },
  })
}
