import { useQuery } from '@tanstack/react-query'

import { getProductPerformanceSummary } from '@/features/reports/api/get-product-performance-summary'
import { reportsKeys } from '@/features/reports/api/query-keys'
import { isValidReportDateRange } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'

/** Product Performance KPIs for `range`. Same gating/staleness reasoning as `useRevenueSummary`/`useProfitSummary`. */
export function useProductPerformanceSummary(range: ReportDateRange) {
  return useQuery({
    queryKey: reportsKeys.productPerformanceSummary(range),
    queryFn: () => getProductPerformanceSummary(range),
    enabled: isValidReportDateRange(range),
    staleTime: 60 * 1000,
  })
}
