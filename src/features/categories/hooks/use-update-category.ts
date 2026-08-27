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
      toast.success('Đã cập nhật danh mục')
    },
    onError: (error) => {
      toast.error(getCategoryErrorMessage(error, 'update'))
    },
  })
}
