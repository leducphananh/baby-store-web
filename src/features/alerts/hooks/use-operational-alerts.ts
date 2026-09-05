import { useMemo } from 'react'

import { useExpiryAlertConditions } from '@/features/reports/hooks/use-expiry-alert-conditions'
import { useInventoryAlertConditions } from '@/features/reports/hooks/use-inventory-alert-conditions'
import { useSlowMovingSummary } from '@/features/reports/hooks/use-slow-moving-summary'
import type { ExpiryHorizonDays, SalesLookbackDays } from '@/features/reports/types/expiry'
import { buildOperationalAlerts } from '@/features/alerts/utils/build-operational-alerts'
import type { OperationalAlert } from '@/features/alerts/types/alert'

/** Same pre-existing app-wide default as Phase 4's `EXPIRING_SOON_DAYS` — an operational horizon for these alerts, not a re-derived permanent threshold (requirement §27, carried over from the Phase 7.7 Attention section this replaces). */
export const ALERT_EXPIRY_HORIZON_DAYS: ExpiryHorizonDays = 30
export const ALERT_SALES_LOOKBACK_DAYS: SalesLookbackDays = 30

/**
 * The one hook every alert surface (Dashboard Attention, header Bell,
 * Alert Center) calls to get the current list of operational conditions
 * (requirement §44/§45): it composes the exact same Phase 7.5/7.6 report
 * hooks a report page itself uses, so React Query serves one shared cache
 * entry regardless of how many surfaces are mounted at once, and feeds
 * them through the one shared `buildOperationalAlerts()` mapping — no
 * alert surface re-derives inventory/expiry/slow-moving facts itself.
 *
 * `includeSlowMoving: false` (the header Bell's usage) skips
 * `useSlowMovingSummary()` entirely via its `enabled` option, rather than
 * fetching and discarding it — the Bell mounts once for the whole
 * authenticated session, but there's still no reason to pay for a query
 * whose result is never read (requirement §46/§49).
 *
 * Inventory conditions (out_of_stock/low_stock) come from
 * `useInventoryAlertConditions()` (Phase 8.2), not `useInventoryValueSummary()`
 * — every consumer of this hook only ever needed the counts/fingerprints
 * for these two alert types, never the valuation numbers
 * (`totalInventoryValue`, etc.) that summary also computes, so this is a
 * strict reduction of what the Bell/Alert Center/Dashboard-Attention query
 * (the Inventory Report page's own KPI cards keep using the full summary
 * directly, unaffected).
 *
 * Expiry conditions (expired/expiring-soon/missing-expiry) come from
 * `useExpiryAlertConditions()` (Phase 8.3), not `useExpirySummary()` —
 * same reasoning, plus a batch-identity fingerprint instead of a bare
 * count. This does mean these three alerts no longer show an inventory
 * VALUE in their description (`useExpiryAlertConditions` doesn't compute
 * one, deliberately, to stay lightweight) — count + navigation is the
 * accepted trade-off (no consumer of this hook needed the value; the
 * Expiry Report itself still shows it via `useExpirySummary` directly,
 * unaffected).
 */
export function useOperationalAlerts({ includeSlowMoving }: { includeSlowMoving: boolean }) {
  const inventoryConditionsQuery = useInventoryAlertConditions()
  const expiryConditionsQuery = useExpiryAlertConditions(ALERT_EXPIRY_HORIZON_DAYS)
  const slowMovingQuery = useSlowMovingSummary(ALERT_SALES_LOOKBACK_DAYS, { enabled: includeSlowMoving })

  const isLoading =
    inventoryConditionsQuery.isLoading ||
    expiryConditionsQuery.isLoading ||
    (includeSlowMoving && slowMovingQuery.isLoading)
  const isError =
    inventoryConditionsQuery.isError || expiryConditionsQuery.isError || (includeSlowMoving && slowMovingQuery.isError)

  const alerts = useMemo<OperationalAlert[]>(() => {
    if (isLoading || isError) return []
    return buildOperationalAlerts({
      inventoryConditions: inventoryConditionsQuery.data,
      expiryConditions: expiryConditionsQuery.data,
      slowMoving: includeSlowMoving ? slowMovingQuery.data : undefined,
      horizonDays: ALERT_EXPIRY_HORIZON_DAYS,
      lookbackDays: ALERT_SALES_LOOKBACK_DAYS,
    })
  }, [
    isLoading,
    isError,
    includeSlowMoving,
    inventoryConditionsQuery.data,
    expiryConditionsQuery.data,
    slowMovingQuery.data,
  ])

  function refetch() {
    void inventoryConditionsQuery.refetch()
    void expiryConditionsQuery.refetch()
    if (includeSlowMoving) void slowMovingQuery.refetch()
  }

  return { alerts, isLoading, isError, refetch }
}
