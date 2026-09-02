import { useQuery } from '@tanstack/react-query'

import { getRevenueSummary } from '@/features/reports/api/get-revenue-summary'
import { reportsKeys } from '@/features/reports/api/query-keys'
import { isValidReportDateRange } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'

/**
 * Revenue KPIs for `range`. `enabled` is gated by `isValidReportDateRange`
 * (requirement §24) so an in-progress invalid custom range (`from > to`)
 * never issues a query — the picker's own inline validation message is the
 * only feedback shown while it's invalid, no failed request. `staleTime`
 * is longer than the app default (30s): revenue for a past period doesn't
 * change on its own, only when an order is completed/cancelled — those
 * mutations invalidate this key directly (see `use-create-order.ts`/
 * `use-cancel-order.ts`), so a long stale window doesn't risk a stale KPI.
 */
export function useRevenueSummary(range: ReportDateRange) {
  return useQuery({
    queryKey: reportsKeys.revenueSummary(range),
    queryFn: () => getRevenueSummary(range),
    enabled: isValidReportDateRange(range),
    staleTime: 60 * 1000,
  })
}
