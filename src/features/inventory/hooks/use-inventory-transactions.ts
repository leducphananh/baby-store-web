import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getInventoryTransactions } from '@/features/inventory/api/get-inventory-transactions'
import { inventoryTransactionKeys } from '@/features/inventory/api/query-keys'
import type { InventoryTransactionFilters } from '@/features/inventory/types/inventory-transaction'

export function useInventoryTransactions(filters: InventoryTransactionFilters) {
  return useQuery({
    queryKey: inventoryTransactionKeys.list(filters),
    queryFn: () => getInventoryTransactions(filters),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
