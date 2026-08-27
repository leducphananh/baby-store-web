import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteCategory } from '@/features/categories/api/delete-category'
import { categoryKeys } from '@/features/categories/api/query-keys'
import { getCategoryErrorMessage } from '@/features/categories/utils/get-category-error-message'

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      toast.success('Đã xóa danh mục')
    },
    onError: (error) => {
      toast.error(getCategoryErrorMessage(error, 'delete'))
    },
  })
}
