import { QueryClient } from '@tanstack/react-query'

/**
 * A throwaway QueryClient for one test render — never the production
 * singleton from `@/lib/query-client`.
 *
 * `retry: false` so a failing query surfaces its error immediately and
 * deterministically instead of the production Phase 9.2 behaviour (retry
 * transient failures up to twice). This is a TEST default only — it does not
 * describe or change production retry behaviour.
 *
 * Create a fresh one per render (this is what `renderWithProviders` does) so
 * no cache entry survives into the next test; that is cleaner than a global
 * `queryClient.clear()` in an afterEach.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}
