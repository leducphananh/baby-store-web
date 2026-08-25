import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client for the whole app.
 *
 * Defaults are deliberately conservative rather than disabling useful React
 * Query behavior wholesale:
 * - `staleTime`: business data (products, orders, inventory...) doesn't need
 *   to refetch on every focus/mount within a short window. 30s cuts down on
 *   redundant requests while still keeping data reasonably fresh. Individual
 *   queries override this per entity (e.g. longer for rarely-changing
 *   lookup data like categories, shorter for near-real-time stock counts) —
 *   see the `react-query` skill.
 * - `retry`: retry twice on failure (network blips), but query hooks still
 *   surface `isError` so every screen can show a real error state — this is
 *   not a substitute for error handling (see `error-handling` skill).
 * - `refetchOnWindowFocus`: on, since this is a multi-tab/multi-staff admin
 *   tool where data can change from another session (e.g. another staff
 *   member records an order) — refetching on focus keeps stock/order views
 *   from going stale unnoticed.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
