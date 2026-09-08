import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createCategory } from '@/features/categories/api/create-category'
import { categoryKeys } from '@/features/categories/api/query-keys'
import { getCategoryErrorMessage } from '@/features/categories/utils/get-category-error-message'

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      // Phase 9.8 (Debt C): `options()` is a sibling key, not under `lists()`,
      // so it wasn't being refreshed — a category created here stayed missing
      // from the Product form's category dropdown (`useAllCategories`) for up
      // to its 5-minute staleTime. staleTime is unchanged; this is the
      // mutation doing its own targeted invalidation.
      void queryClient.invalidateQueries({ queryKey: categoryKeys.options() })
      toast.success('Đã tạo danh mục mới')
    },
    onError: (error) => {
      toast.error(getCategoryErrorMessage(error, 'create'))
    },
  })
}
