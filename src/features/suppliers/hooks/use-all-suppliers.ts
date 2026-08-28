import { useQuery } from '@tanstack/react-query'

import { getAllSuppliers } from '@/features/suppliers/api/get-all-suppliers'
import { supplierKeys } from '@/features/suppliers/api/query-keys'

/**
 * Full supplier lookup list for selects/filters in other features. Rarely
 * changes, so a long `staleTime` keeps dropdowns from refetching mid-form.
 */
export function useAllSuppliers() {
  return useQuery({
    queryKey: supplierKeys.options(),
    queryFn: getAllSuppliers,
    staleTime: 5 * 60 * 1000,
  })
}
