import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createCustomer } from '@/features/customers/api/create-customer'
import { customerKeys } from '@/features/customers/api/query-keys'
import { getCustomerErrorMessage } from '@/features/customers/utils/get-customer-error-message'

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      toast.success('Đã thêm khách hàng mới')
    },
    onError: (error) => {
      toast.error(getCustomerErrorMessage(error, 'create'))
    },
  })
}
