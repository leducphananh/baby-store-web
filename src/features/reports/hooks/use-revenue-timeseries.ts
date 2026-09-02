import { useQuery } from '@tanstack/react-query'

import { getRevenueTimeseries } from '@/features/reports/api/get-revenue-timeseries'
import { reportsKeys } from '@/features/reports/api/query-keys'
import { isValidReportDateRange } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'

/**
 * Daily revenue series for `range`, backing both the chart and the daily
 * breakdown table (fetched once at the page level and passed down — see
 * `revenue-report-page.tsx` — never fetched a second time "for the table",
 * requirement §20). Same enable-gate/staleTime reasoning as
 * `useRevenueSummary`.
 */
export function useRevenueTimeseries(range: ReportDateRange) {
  return useQuery({
    queryKey: reportsKeys.revenueTimeseries(range),
    queryFn: () => getRevenueTimeseries(range),
    enabled: isValidReportDateRange(range),
    staleTime: 60 * 1000,
  })
}
