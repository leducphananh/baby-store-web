import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateCategory } from '@/features/categories/api/update-category'
import { categoryKeys } from '@/features/categories/api/query-keys'
import { getCategoryErrorMessage } from '@/features/categories/utils/get-category-error-message'

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) })
      // Phase 9.8 (Debt C): also refresh the lookup list feeding other
      // features' dropdowns so a renamed category shows its new label there.
      void queryClient.invalidateQueries({ queryKey: categoryKeys.options() })
      toast.success('Đã cập nhật danh mục')
    },
    onError: (error) => {
      toast.error(getCategoryErrorMessage(error, 'update'))
    },
  })
}
