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
      toast.success('Đã tạo danh mục mới')
    },
    onError: (error) => {
      toast.error(getCategoryErrorMessage(error, 'create'))
    },
  })
}
