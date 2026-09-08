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
  /**
   * Live sellable-stock lookup for a known set of ids (see
   * `use-product-stock-map.ts`). The ids are sorted into the key so the
   * same set in a different order (e.g. order lines re-fetched in a
   * different sequence) resolves to one cache entry, not several
   * (`react-query` rule 9 — a key must be deterministic for its inputs).
   * The `queryFn` still receives the caller's original array; `.in(...)`
   * is order-independent.
   */
  stockMap: (productIds: string[]) =>
    [...productKeys.all, 'stock-map', [...productIds].sort()] as const,
}
