import { useQuery } from '@tanstack/react-query'

import { getProfitSummary } from '@/features/reports/api/get-profit-summary'
import { reportsKeys } from '@/features/reports/api/query-keys'
import { isValidReportDateRange } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'

/**
 * Gross Profit KPIs for `range`. Same gating/staleness reasoning as
 * `useRevenueSummary`: `enabled` requires a valid range so an in-progress
 * custom-range edit never issues a query, and `staleTime` is longer than
 * the app default since profit for a past period only changes when an
 * order is completed/cancelled — those mutations invalidate the whole
 * `reportsKeys.all` key space (see `use-create-order.ts`/`use-cancel-order.ts`).
 */
export function useProfitSummary(range: ReportDateRange) {
  return useQuery({
    queryKey: reportsKeys.profitSummary(range),
    queryFn: () => getProfitSummary(range),
    enabled: isValidReportDateRange(range),
    staleTime: 60 * 1000,
  })
}
