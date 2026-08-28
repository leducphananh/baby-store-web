import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { uploadProductImage } from '@/features/products/api/upload-product-image'
import { productKeys } from '@/features/products/api/query-keys'
import { getImageErrorMessage } from '@/features/products/utils/get-image-error-message'

/**
 * Upload a single image. The manager calls this sequentially per file (so
 * per-file feedback is clear and two "first image" uploads can't race for
 * the primary flag), which is why the success toast is left to the caller —
 * one summary toast beats N.
 */
export function useUploadProductImage(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadProductImage({ productId, file }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.images(productId) })
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
    onError: (error) => {
      toast.error(getImageErrorMessage(error, 'upload'))
    },
  })
}
