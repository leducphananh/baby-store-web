---
name: react-query
description: TanStack Query conventions for this project — query key structure, cache/invalidation strategy, loading/error/empty handling, mutation patterns. Apply whenever fetching or mutating server data.
---

# TanStack Query conventions

## Apply when
Fetching, caching, or mutating any data that lives in Supabase (products, orders, batches,
inventory, reports, etc.).

## Rules

1. **All server state lives in React Query. Never duplicate server data into Zustand or
   local `useState`** — if it came from the database, it's a query, not app state. See
   `zustand` skill for the boundary.
2. **One hook per query/mutation, in the feature's `hooks/`, wrapping a function from
   `api/`:**
   ```ts
   // features/products/hooks/use-products.ts
   export function useProducts(filters: ProductFilters) {
     return useQuery({
       queryKey: productKeys.list(filters),
       queryFn: () => getProducts(filters),
     })
   }
   ```
3. **Standardize query keys per feature** with a key factory, not ad-hoc arrays scattered
   across files:
   ```ts
   // features/products/api/query-keys.ts
   export const productKeys = {
     all: ['products'] as const,
     lists: () => [...productKeys.all, 'list'] as const,
     list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
     details: () => [...productKeys.all, 'detail'] as const,
     detail: (id: string) => [...productKeys.details(), id] as const,
   }
   ```
4. **Invalidate intentionally, at the narrowest correct scope.** A `createProduct` mutation
   invalidates `productKeys.lists()`, not the entire query cache. Prefer
   `queryClient.invalidateQueries({ queryKey: productKeys.lists() })` over broad
   `invalidateQueries()` calls.
5. **Every query consumer handles three states explicitly:** loading (skeleton, not a blank
   screen), error (message + retry, not a silent failure), and empty (a real empty state,
   not an empty table with no explanation). Don't destructure only `data` and ignore
   `isLoading`/`isError`.
6. **Mutations use `onSuccess` for cache invalidation/navigation and surface errors to the
   user** (toast or inline form error) — never swallow a mutation error silently.
7. **Optimistic updates only where UX clearly benefits** (e.g. toggling a flag) and always
   with an `onError` rollback via `onMutate`/`context`. Don't add optimistic updates to
   complex multi-step flows (import receipts, order creation) where correctness matters
   more than perceived speed.
8. **Cross-entity consistency:** when a mutation affects multiple domains (e.g. creating an
   import receipt affects both `inventory` and `batches`), invalidate all affected query
   key groups in that mutation's `onSuccess`, not from unrelated places.
9. **Pagination/filtering params are part of the query key** so each filter combination
   caches independently; don't manage filtered data by hand-slicing a single unfiltered
   query result.
10. **Set sane defaults once** in the query client (`staleTime`, `retry`) in
    `src/lib/query-client.ts`, and override per-query only when a specific query needs
    different behavior (e.g. near-real-time inventory counts vs. rarely-changing categories).

## Anti-patterns to reject in review

- A `useEffect` that copies `query.data` into a `useState`/Zustand store "to make it easier
  to use" — use `query.data` directly.
- `queryClient.invalidateQueries()` with no key after every mutation.
- A component that renders `data.map(...)` without checking `isLoading`/`isError` first.
- Query keys built as plain strings (`'products-' + JSON.stringify(filters)`) instead of
  the array key factory pattern.
