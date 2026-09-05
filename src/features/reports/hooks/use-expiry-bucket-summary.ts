import { useQuery } from '@tanstack/react-query'

import { getExpiryBucketSummary } from '@/features/reports/api/get-expiry-bucket-summary'
import { reportsKeys } from '@/features/reports/api/query-keys'

/** Full expiry-distance distribution — no horizon, current-state snapshot. */
export function useExpiryBucketSummary() {
  return useQuery({
    queryKey: reportsKeys.expiryBucketSummary(),
    queryFn: getExpiryBucketSummary,
    // Short staleTime (requirement §56): expiry status shifts by itself as
    // the calendar day changes, even with no data mutation — a long-lived
    // cache would silently show yesterday's classification.
    staleTime: 5 * 60 * 1000,
  })
}
