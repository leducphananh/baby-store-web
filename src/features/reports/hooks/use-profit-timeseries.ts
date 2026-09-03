import { useQuery } from '@tanstack/react-query'

import { getProfitTimeseries } from '@/features/reports/api/get-profit-timeseries'
import { reportsKeys } from '@/features/reports/api/query-keys'
import { isValidReportDateRange } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'

/**
 * Daily revenue/COGS/gross-profit series for `range`, backing both the
 * chart and the daily breakdown table (fetched once at the page level and
 * passed down — see `profit-report-page.tsx` — never fetched a second time
 * "for the table"). Same enable-gate/staleTime reasoning as `useProfitSummary`.
 */
export function useProfitTimeseries(range: ReportDateRange) {
  return useQuery({
    queryKey: reportsKeys.profitTimeseries(range),
    queryFn: () => getProfitTimeseries(range),
    enabled: isValidReportDateRange(range),
    staleTime: 60 * 1000,
  })
}
