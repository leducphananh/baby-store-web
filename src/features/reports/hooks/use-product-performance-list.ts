import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getProductPerformanceList } from '@/features/reports/api/get-product-performance-list'
import { reportsKeys } from '@/features/reports/api/query-keys'
import { isValidReportDateRange } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'
import type { ProductPerformanceFilters } from '@/features/reports/types/product-performance'

/**
 * Paginated/sorted/filtered product performance table data. Filter/sort/
 * page state is part of the query key (same convention as `useProducts`),
 * and `placeholderData: keepPreviousData` keeps the current rows on screen
 * while the next page/filter/sort loads instead of flashing a skeleton on
 * every keystroke or click — `isFetching` (exposed by the query result) is
 * what the page uses to visibly dim the table during that refetch, so a
 * still-displayed ranking is never mistaken for the newly selected filter's
 * result (requirement §56).
 */
export function useProductPerformanceList(range: ReportDateRange, filters: ProductPerformanceFilters) {
  return useQuery({
    queryKey: reportsKeys.productPerformanceList(range, filters),
    queryFn: () => getProductPerformanceList(range, filters),
    enabled: isValidReportDateRange(range),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
