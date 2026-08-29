import type { InventoryTransactionFilters } from '@/features/inventory/types/inventory-transaction'

/** Query key factory (see `react-query`) — same convention as `importReceiptKeys`. */
export const inventoryTransactionKeys = {
  all: ['inventory-transactions'] as const,
  lists: () => [...inventoryTransactionKeys.all, 'list'] as const,
  list: (filters: InventoryTransactionFilters) =>
    [...inventoryTransactionKeys.lists(), filters] as const,
}
