import { useQuery } from '@tanstack/react-query'

import { getCategoryPerformance } from '@/features/reports/api/get-category-performance'
import { reportsKeys } from '@/features/reports/api/query-keys'
import { isValidReportDateRange } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'

/** Category-level performance for `range`, backing the Category Performance section. */
export function useCategoryPerformance(range: ReportDateRange) {
  return useQuery({
    queryKey: reportsKeys.categoryPerformance(range),
    queryFn: () => getCategoryPerformance(range),
    enabled: isValidReportDateRange(range),
    staleTime: 60 * 1000,
  })
}
