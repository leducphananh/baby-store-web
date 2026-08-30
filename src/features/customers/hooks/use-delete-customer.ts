import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteCustomer } from '@/features/customers/api/delete-customer'
import { customerKeys } from '@/features/customers/api/query-keys'
import { getCustomerErrorMessage } from '@/features/customers/utils/get-customer-error-message'

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      toast.success('Đã xóa khách hàng')
    },
    onError: (error) => {
      toast.error(getCustomerErrorMessage(error, 'delete'))
    },
  })
}
