import { toReportQueryBounds } from '@/features/reports/utils/report-date-range'
import type { ReportDateRange } from '@/features/reports/types/report'
import type { ProductPerformanceFilters } from '@/features/reports/types/product-performance'
import type { InventoryReportFilters } from '@/features/reports/types/inventory'
import type {
  ExpiryBatchFilters,
  ExpiryHorizonDays,
  SlowMovingFilters,
} from '@/features/reports/types/expiry'

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
  // No date range: current-state snapshot, not a sales-period report
  // (requirement §2/§56/§58).
  inventory: () => [...reportsKeys.all, 'inventory'] as const,
  inventorySummary: () => [...reportsKeys.inventory(), 'summary'] as const,
  inventoryProductList: (filters: InventoryReportFilters) =>
    [
      ...reportsKeys.inventory(),
      'list',
      filters.search,
      filters.categoryId ?? 'all',
      filters.stockStatus,
      filters.sortField,
      filters.sortDesc,
      filters.page,
      filters.pageSize,
    ] as const,
  inventoryCategorySummary: () => [...reportsKeys.inventory(), 'category'] as const,
  // Phase 8.2 — the header Bell/Alert Center's entity-aware source for
  // out_of_stock/low_stock specifically, nested under the same
  // `reportsKeys.inventory()` umbrella so it's covered by the existing
  // `confirm_import_receipt`/`create_order`/`cancel_order` invalidations
  // (`reportsKeys.all`/`reportsKeys.inventory()`) with no new invalidation
  // call needed at those sites.
  inventoryAlertConditions: () => [...reportsKeys.inventory(), 'alert-conditions'] as const,
  // Umbrella for the whole Expiry & Slow-moving Report page — two
  // independent sub-namespaces below, neither keyed by a sales
  // ReportDateRange (requirement §20/§54): expiry is a current-inventory
  // snapshot keyed only by horizon/filters; slow-moving a current-
  // inventory + recent-sales snapshot keyed only by lookback/filters.
  expiryReport: () => [...reportsKeys.all, 'expiry-report'] as const,
  expiry: () => [...reportsKeys.expiryReport(), 'expiry'] as const,
  expiryBucketSummary: () => [...reportsKeys.expiry(), 'buckets'] as const,
  expirySummary: (horizonDays: ExpiryHorizonDays) =>
    [...reportsKeys.expiry(), 'summary', horizonDays] as const,
  expiryBatchList: (filters: ExpiryBatchFilters) =>
    [
      ...reportsKeys.expiry(),
      'batches',
      filters.horizonDays,
      filters.search,
      filters.categoryId ?? 'all',
      filters.statusFilter,
      filters.sortField,
      filters.sortDesc,
      filters.page,
      filters.pageSize,
    ] as const,
  slowMoving: () => [...reportsKeys.expiryReport(), 'slow-moving'] as const,
  slowMovingSummary: (lookbackDays: number) => [...reportsKeys.slowMoving(), 'summary', lookbackDays] as const,
  slowMovingProducts: (filters: SlowMovingFilters) =>
    [
      ...reportsKeys.slowMoving(),
      filters.lookbackDays,
      filters.search,
      filters.categoryId ?? 'all',
      filters.sortField,
      filters.sortDesc,
      filters.page,
      filters.pageSize,
    ] as const,
}
