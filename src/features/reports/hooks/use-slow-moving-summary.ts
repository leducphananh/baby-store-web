import { useQuery } from '@tanstack/react-query'

import { getSlowMovingSummary } from '@/features/reports/api/get-slow-moving-summary'
import { reportsKeys } from '@/features/reports/api/query-keys'
import type { SalesLookbackDays } from '@/features/reports/types/expiry'

/**
 * Factual "never sold" / "no sale in lookback" KPIs. `enabled` defaults to
 * `true`; the Alert Foundation's header Bell (Phase 8.1) passes `false` to
 * skip this query entirely there (requirement §49 — slow-moving is
 * omitted from the global, every-page Bell for cost, not from the
 * Dashboard/Alert Center).
 */
export function useSlowMovingSummary(lookbackDays: SalesLookbackDays, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reportsKeys.slowMovingSummary(lookbackDays),
    queryFn: () => getSlowMovingSummary(lookbackDays),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}
