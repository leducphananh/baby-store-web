import type { ProductSearchOptions } from '@/features/products/api/search-products'
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
  /** Lean search-as-you-type results for pickers (see `search-products.ts`). */
  search: (query: string, options: ProductSearchOptions = {}) =>
    [...productKeys.all, 'search', query, options] as const,
  /** Live sellable-stock lookup for a known set of ids (see `use-product-stock-map.ts`). */
  stockMap: (productIds: string[]) => [...productKeys.all, 'stock-map', productIds] as const,
}
