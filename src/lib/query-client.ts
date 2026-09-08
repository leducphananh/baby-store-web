import { QueryClient } from '@tanstack/react-query'

const MAX_QUERY_RETRIES = 2

/**
 * Transient PostgreSQL SQLSTATE classes — connection loss, transaction
 * rollback (deadlock/serialization), insufficient resources, operator
 * intervention, internal error. Effectively unreachable on this app's
 * read path (reads take no locks under READ COMMITTED), but excluded from
 * the "don't retry" rule so they keep their retries if they ever occur.
 */
const TRANSIENT_PG_ERROR_CLASSES = ['08', '40', '53', '57', 'XX']

/**
 * True for errors that a retry cannot fix: an HTTP 4xx from the Auth/
 * Storage/Functions clients, or a PostgREST/Postgres error carrying a
 * SQLSTATE-style `code` (RLS denial `42501`, `PGRST*` request errors,
 * unique/check/FK violations, `PGRST116` no-rows, ...). Retrying these
 * just makes the same failed request 2 more times over ~3s before the UI
 * can show the real error (`react-query` skill rule 10, requirement §73).
 */
function isDeterministicError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const candidate = error as { code?: unknown; status?: unknown; statusCode?: unknown }

  const status =
    typeof candidate.status === 'number'
      ? candidate.status
      : typeof candidate.statusCode === 'number'
        ? candidate.statusCode
        : undefined
  if (status !== undefined && status >= 400 && status < 500) return true

  if (typeof candidate.code === 'string' && candidate.code.length > 0) {
    return !TRANSIENT_PG_ERROR_CLASSES.some((cls) => (candidate.code as string).startsWith(cls))
  }

  return false
}

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
 * - `retry`: retry transient failures (network blips, 5xx) up to twice, but
 *   never retry a deterministic error — an RLS denial, a validation/
 *   constraint error, a `PGRST*` request error — where the 2 extra attempts
 *   are pure wasted network work and only delay the error UI by ~3s
 *   (requirement §73). Query hooks still surface `isError` so every screen
 *   shows a real error state — this is not a substitute for error handling
 *   (see `error-handling` skill).
 * - `refetchOnWindowFocus`: on, since this is a multi-tab/multi-staff admin
 *   tool where data can change from another session (e.g. another staff
 *   member records an order) — refetching on focus keeps stock/order views
 *   from going stale unnoticed. Per-query `staleTime` gates how often this
 *   actually fires.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: (failureCount, error) => {
        if (failureCount >= MAX_QUERY_RETRIES) return false
        return !isDeterministicError(error)
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Never auto-retry a mutation: several are non-idempotent business
      // transactions (`create_order`, `complete_order`, `confirm_import_receipt`,
      // `adjust_inventory`, `record_order_payment`) where a blind retry could
      // double-apply the operation (requirement §74/§75).
      retry: 0,
    },
  },
})
