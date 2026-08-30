import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateCustomer } from '@/features/customers/api/update-customer'
import { customerKeys } from '@/features/customers/api/query-keys'
import { getCustomerErrorMessage } from '@/features/customers/utils/get-customer-error-message'

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCustomer,
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) })
      toast.success('Đã cập nhật khách hàng')
    },
    onError: (error) => {
      toast.error(getCustomerErrorMessage(error, 'update'))
    },
  })
}
