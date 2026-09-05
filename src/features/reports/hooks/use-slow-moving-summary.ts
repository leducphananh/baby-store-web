import { useQuery } from '@tanstack/react-query'

import { getSlowMovingSummary } from '@/features/reports/api/get-slow-moving-summary'
import { reportsKeys } from '@/features/reports/api/query-keys'
import type { SalesLookbackDays } from '@/features/reports/types/expiry'

/** Factual "never sold" / "no sale in lookback" KPIs. */
export function useSlowMovingSummary(lookbackDays: SalesLookbackDays) {
  return useQuery({
    queryKey: reportsKeys.slowMovingSummary(lookbackDays),
    queryFn: () => getSlowMovingSummary(lookbackDays),
    staleTime: 5 * 60 * 1000,
  })
}
