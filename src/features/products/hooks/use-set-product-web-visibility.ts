import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { setProductWebVisibility } from '@/features/products/api/set-product-web-visibility'
import { productKeys } from '@/features/products/api/query-keys'
import { getProductErrorMessage } from '@/features/products/utils/get-product-error-message'

/**
 * Publish/unpublish a product to the storefront (list-row quick action —
 * see `product-columns.tsx`). Not optimistic: the row keeps showing its
 * current badge until the write actually succeeds, so a failure never
 * leaves the UI claiming a state the database doesn't have (task §10/§19).
 */
export function useSetProductWebVisibility() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setProductWebVisibility,
    onSuccess: (_data, { id, isWebVisible }) => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: productKeys.detail(id) })
      toast.success(isWebVisible ? 'Đã đăng sản phẩm lên website' : 'Đã ẩn sản phẩm khỏi website')
    },
    onError: (error) => {
      toast.error(getProductErrorMessage(error, 'webVisibility'))
    },
  })
}
