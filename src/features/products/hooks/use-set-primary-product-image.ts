import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { setPrimaryProductImage } from '@/features/products/api/set-primary-product-image'
import { productKeys } from '@/features/products/api/query-keys'
import { getImageErrorMessage } from '@/features/products/utils/get-image-error-message'

export function useSetPrimaryProductImage(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (imageId: string) => setPrimaryProductImage({ productId, imageId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.images(productId) })
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Đã đặt ảnh chính')
    },
    onError: (error) => {
      toast.error(getImageErrorMessage(error, 'primary'))
    },
  })
}
