import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteProductImage } from '@/features/products/api/delete-product-image'
import { productKeys } from '@/features/products/api/query-keys'
import { getImageErrorMessage } from '@/features/products/utils/get-image-error-message'
import type { ProductImage } from '@/features/products/types/product'

export function useDeleteProductImage(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (image: Pick<ProductImage, 'id' | 'storagePath' | 'isPrimary'>) =>
      deleteProductImage({ productId, image }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.images(productId) })
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Đã xóa ảnh')
    },
    onError: (error) => {
      toast.error(getImageErrorMessage(error, 'delete'))
    },
  })
}
