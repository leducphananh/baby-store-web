import type { InventoryTransactionFilters } from '@/features/inventory/types/inventory-transaction'
import type { InventoryOverviewFilters } from '@/features/inventory/types/inventory-overview'

/** Query key factory (see `react-query`) — same convention as `importReceiptKeys`. */
export const inventoryTransactionKeys = {
  all: ['inventory-transactions'] as const,
  lists: () => [...inventoryTransactionKeys.all, 'list'] as const,
  list: (filters: InventoryTransactionFilters) =>
    [...inventoryTransactionKeys.lists(), filters] as const,
}

/** Same convention, for the Inventory Dashboard's product overview (Phase 4.6). */
export const inventoryOverviewKeys = {
  all: ['inventory-overview'] as const,
  lists: () => [...inventoryOverviewKeys.all, 'list'] as const,
  list: (filters: InventoryOverviewFilters) => [...inventoryOverviewKeys.lists(), filters] as const,
  /** Global, unfiltered alert-card counts — one key, not per-filter. */
  summary: () => [...inventoryOverviewKeys.all, 'summary'] as const,
}
