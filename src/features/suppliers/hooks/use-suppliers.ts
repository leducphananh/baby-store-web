import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getSuppliers } from '@/features/suppliers/api/get-suppliers'
import { supplierKeys } from '@/features/suppliers/api/query-keys'
import type { SupplierFilters } from '@/features/suppliers/types/supplier'

export function useSuppliers(filters: SupplierFilters) {
  return useQuery({
    queryKey: supplierKeys.list(filters),
    queryFn: () => getSuppliers(filters),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
