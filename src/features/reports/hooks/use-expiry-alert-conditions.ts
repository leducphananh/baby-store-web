import { useQuery } from '@tanstack/react-query'

import { getExpiryAlertConditions } from '@/features/reports/api/get-expiry-alert-conditions'
import { reportsKeys } from '@/features/reports/api/query-keys'
import type { ExpiryHorizonDays } from '@/features/reports/types/expiry'

/**
 * Current expired/expiring-soon/missing-expiry alert occurrence data
 * (Phase 8.3) — a current-state snapshot like `useExpirySummary`, but this
 * is what `useOperationalAlerts` uses instead (batch-identity-aware
 * fingerprint, lighter query). The Expiry Report page keeps using
 * `useExpirySummary`/`useExpiryBatchList` directly for its own
 * user-selectable-horizon KPIs/table — unaffected by this hook.
 *
 * Same `staleTime` as `useExpirySummary` (5 minutes) — expiry conditions
 * can change on the calendar alone (a batch crossing into "expired" at
 * midnight) with no mutation to invalidate against, so this is a bounded
 * time-based refresh, not reliance on mutation invalidation alone (there is
 * no cron/Realtime forcing an instant flip at 00:00:00 — the badge/list
 * catches up on the next refetch: mutation-triggered invalidation, this
 * staleTime elapsing, window refocus, or a manual "Làm mới").
 */
export function useExpiryAlertConditions(horizonDays: ExpiryHorizonDays) {
  return useQuery({
    queryKey: reportsKeys.expiryAlertConditions(horizonDays),
    queryFn: () => getExpiryAlertConditions(horizonDays),
    staleTime: 5 * 60 * 1000,
  })
}
