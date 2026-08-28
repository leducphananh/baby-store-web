import type { ProductFilters } from '@/features/products/types/product'

/** Query key factory (see `react-query`) — same convention as `categoryKeys`/`supplierKeys`. */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  batches: (id: string) => [...productKeys.detail(id), 'batches'] as const,
  images: (id: string) => [...productKeys.detail(id), 'images'] as const,
}
