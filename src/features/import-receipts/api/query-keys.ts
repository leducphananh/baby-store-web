import type { ImportReceiptFilters } from '@/features/import-receipts/types/import-receipt'

/** Query key factory (see `react-query`) — same convention as `supplierKeys`. */
export const importReceiptKeys = {
  all: ['import-receipts'] as const,
  lists: () => [...importReceiptKeys.all, 'list'] as const,
  list: (filters: ImportReceiptFilters) => [...importReceiptKeys.lists(), filters] as const,
  nextNumber: () => [...importReceiptKeys.all, 'next-number'] as const,
  details: () => [...importReceiptKeys.all, 'detail'] as const,
  detail: (id: string) => [...importReceiptKeys.details(), id] as const,
  lines: (id: string) => [...importReceiptKeys.detail(id), 'lines'] as const,
}
