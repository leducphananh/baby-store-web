import { toReportQueryBounds } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'
import type { ProductPerformanceFilters } from '@/features/reports/types/product-performance'

/**
 * Normalized-bounds cache key, not the raw `ReportDateRange` object — two
 * different inputs that resolve to the identical instant bounds (e.g. a
 * `custom` range someone happens to type in that matches "Tháng này"
 * exactly) correctly share one cache entry, and the key is always a plain
 * string pair, never a raw `Date` (see `react-query` skill rule 9 and
 * requirement §23).
 */
function boundsKeyPart(range: ReportDateRange): [string, string] {
  const { fromIso, toExclusiveIso } = toReportQueryBounds(range)
  return [fromIso, toExclusiveIso]
}

/** Query key factory for the Reports feature — same convention as `orderKeys`/`productKeys` (see `react-query`). */
export const reportsKeys = {
  all: ['reports'] as const,
  revenue: () => [...reportsKeys.all, 'revenue'] as const,
  revenueSummary: (range: ReportDateRange) =>
    [...reportsKeys.revenue(), 'summary', ...boundsKeyPart(range)] as const,
  revenueTimeseries: (range: ReportDateRange) =>
    [...reportsKeys.revenue(), 'timeseries', ...boundsKeyPart(range)] as const,
  profit: () => [...reportsKeys.all, 'profit'] as const,
  profitSummary: (range: ReportDateRange) =>
    [...reportsKeys.profit(), 'summary', ...boundsKeyPart(range)] as const,
  profitTimeseries: (range: ReportDateRange) =>
    [...reportsKeys.profit(), 'timeseries', ...boundsKeyPart(range)] as const,
  productPerformance: () => [...reportsKeys.all, 'product-performance'] as const,
  productPerformanceSummary: (range: ReportDateRange) =>
    [...reportsKeys.productPerformance(), 'summary', ...boundsKeyPart(range)] as const,
  productPerformanceList: (range: ReportDateRange, filters: ProductPerformanceFilters) =>
    [
      ...reportsKeys.productPerformance(),
      'list',
      ...boundsKeyPart(range),
      filters.search,
      filters.categoryId ?? 'all',
      filters.sortField,
      filters.sortDesc,
      filters.page,
      filters.pageSize,
    ] as const,
  categoryPerformance: (range: ReportDateRange) =>
    [...reportsKeys.productPerformance(), 'category', ...boundsKeyPart(range)] as const,
}
