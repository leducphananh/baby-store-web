import { useQuery } from '@tanstack/react-query'

import { getExpirySummary } from '@/features/reports/api/get-expiry-summary'
import { reportsKeys } from '@/features/reports/api/query-keys'
import type { ExpiryHorizonDays } from '@/features/reports/types/expiry'

/** Horizon-scoped expiry-risk KPIs. */
export function useExpirySummary(horizonDays: ExpiryHorizonDays) {
  return useQuery({
    queryKey: reportsKeys.expirySummary(horizonDays),
    queryFn: () => getExpirySummary(horizonDays),
    staleTime: 5 * 60 * 1000,
  })
}
