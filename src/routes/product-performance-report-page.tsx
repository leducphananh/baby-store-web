import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Boxes, PiggyBank, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePersistedPageSize } from '@/hooks/use-persisted-page-size'
import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/route-paths'
import { KpiCard } from '@/features/reports/components/kpi-card'
import { CategoryPerformanceTable } from '@/features/reports/components/category-performance-table'
import { ProductPerformanceFilters } from '@/features/reports/components/product-performance-filters'
import { ProductPerformanceTable } from '@/features/reports/components/product-performance-table'
import { ReportDateRangePicker } from '@/features/reports/components/report-date-range-picker'
import { TopProductsChart } from '@/features/reports/components/top-products-chart'
import { useReportDateRangeStore } from '@/features/reports/hooks/use-report-date-range-store'
import { useCategoryPerformance } from '@/features/reports/hooks/use-category-performance'
import { useProductPerformanceList } from '@/features/reports/hooks/use-product-performance-list'
import { useProductPerformanceSummary } from '@/features/reports/hooks/use-product-performance-summary'
import { isValidReportDateRange } from '@/features/reports/utils/report-date-range'
import type { ProductPerformanceSortField } from '@/features/reports/types/product-performance'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_STORAGE_KEY = 'baby-wale.reports.product-performance.page-size'
/** The chart is always fixed to this — see `TopProductsChart`'s own doc comment for why. */
const TOP_PRODUCTS_CHART_SIZE = 10

function BackLink() {
  return (
    <Link
      to={ROUTES.reports}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Báo cáo
    </Link>
  )
}

/**
 * Product Performance Report (Phase 7.4). Answers three deliberately
 * separate questions — "Bán chạy" (sold quantity), "Doanh thu cao"
 * (revenue) and "Lợi nhuận cao" (gross profit) are never collapsed into one
 * ambiguous ranking (requirement §13) — via `get_product_performance_summary()`/
 * `get_product_performance_list()`/`get_category_performance()`, all three
 * already scoped to completed orders with `completed_at` as the business
 * date and revenue/COGS from the same historical snapshots as Revenue/Profit
 * Report (see their migration comments); nothing here recomputes those rules.
 *
 * The date range is the shared `useReportDateRangeStore`, same as every
 * other report page. Search/category filter the product table+chart only —
 * the KPI row is a whole-report figure for the selected period, unaffected
 * by them (matching what `get_product_performance_summary()` itself takes
 * as parameters).
 */
function ProductPerformanceReportPage() {
  const range = useReportDateRangeStore((state) => state.range)
  const setPreset = useReportDateRangeStore((state) => state.setPreset)
  const setCustomRange = useReportDateRangeStore((state) => state.setCustomRange)
  const isRangeValid = isValidReportDateRange(range)

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = usePersistedPageSize(PAGE_SIZE_STORAGE_KEY, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE)
  const [sorting, setSorting] = useState<{ id: ProductPerformanceSortField; desc: boolean }>({
    id: 'revenue',
    desc: true,
  })
  const debouncedSearch = useDebouncedValue(search, 300)

  function resetToFirstPage() {
    setPage(1)
  }

  const listFilters = {
    search: debouncedSearch,
    categoryId,
    sortField: sorting.id,
    sortDesc: sorting.desc,
    page,
    pageSize,
  }

  const summaryQuery = useProductPerformanceSummary(range)
  const listQuery = useProductPerformanceList(range, listFilters)
  // Independent of the table's own filter/sort/page state (requirement
  // §68: reuse the same RPC/hook with fixed params, not a dedicated "top
  // products" RPC) — always the true top 10 by revenue regardless of what
  // the user is currently searching/sorting the table by.
  const topProductsQuery = useProductPerformanceList(range, {
    search: '',
    categoryId: null,
    sortField: 'revenue',
    sortDesc: true,
    page: 1,
    pageSize: TOP_PRODUCTS_CHART_SIZE,
  })
  const categoryQuery = useCategoryPerformance(range)

  const products = listQuery.data?.data ?? []
  const total = listQuery.data?.total ?? 0
  const hasAnySales = (summaryQuery.data?.productsSoldCount ?? 0) > 0
  const isFilterActive = debouncedSearch.trim().length > 0 || categoryId !== null
  const isTableEmpty = products.length === 0

  return (
    <PageContent>
      <BackLink />

      <PageHeader
        title="Hiệu quả sản phẩm"
        description="Sản phẩm bán chạy, doanh thu và lợi nhuận gộp theo từng sản phẩm và danh mục."
      />

      <div className="space-y-2" data-tour="product-performance-date-range">
        <ReportDateRangePicker
          value={range}
          onChange={(next) =>
            next.preset === 'custom' ? setCustomRange(next.from, next.to) : setPreset(next.preset)
          }
        />
      </div>

      {isRangeValid && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-tour="product-performance-kpis">
            <KpiCard
              title="Sản phẩm có phát sinh bán"
              value={formatNumber(summaryQuery.data?.productsSoldCount ?? 0)}
              icon={Boxes}
              isLoading={summaryQuery.isLoading}
            />
            <KpiCard
              title="Tổng số đơn vị bán"
              value={formatNumber(summaryQuery.data?.totalUnitsSold ?? 0)}
              subtitle="Cộng dồn theo số lượng, không phân biệt đơn vị tính"
              icon={Boxes}
              isLoading={summaryQuery.isLoading}
            />
            <KpiCard
              title="Doanh thu cao nhất"
              value={
                summaryQuery.data?.topRevenueProduct
                  ? formatCurrencyVND(summaryQuery.data.topRevenueProduct.revenue)
                  : '—'
              }
              subtitle={summaryQuery.data?.topRevenueProduct?.name}
              icon={TrendingUp}
              isLoading={summaryQuery.isLoading}
            />
            <KpiCard
              title="Lợi nhuận cao nhất"
              value={
                summaryQuery.data?.topProfitProduct
                  ? formatCurrencyVND(summaryQuery.data.topProfitProduct.grossProfit)
                  : '—'
              }
              subtitle={summaryQuery.data?.topProfitProduct?.name}
              icon={PiggyBank}
              isLoading={summaryQuery.isLoading}
            />
          </div>

          {summaryQuery.isError && (
            <ErrorState
              message="Không thể tải báo cáo hiệu quả sản phẩm."
              onRetry={() => void summaryQuery.refetch()}
            />
          )}

          {!summaryQuery.isLoading && !summaryQuery.isError && !hasAnySales ? (
            <EmptyState title="Chưa có dữ liệu bán hàng trong khoảng thời gian này." />
          ) : (
            <>
              <Card data-tour="product-performance-chart">
                <CardHeader>
                  <CardTitle>Top 10 sản phẩm theo doanh thu</CardTitle>
                </CardHeader>
                <CardContent>
                  {topProductsQuery.isError ? (
                    <ErrorState
                      message="Không thể tải biểu đồ sản phẩm."
                      onRetry={() => void topProductsQuery.refetch()}
                    />
                  ) : topProductsQuery.isLoading ? (
                    <Skeleton className="h-80 w-full" />
                  ) : (
                    <TopProductsChart data={topProductsQuery.data?.data ?? []} />
                  )}
                </CardContent>
              </Card>

              <Card data-tour="product-performance-table">
                <CardHeader>
                  <CardTitle>Chi tiết theo sản phẩm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProductPerformanceFilters
                    search={search}
                    onSearchChange={(value) => {
                      setSearch(value)
                      resetToFirstPage()
                    }}
                    categoryId={categoryId}
                    onCategoryChange={(value) => {
                      setCategoryId(value)
                      resetToFirstPage()
                    }}
                  />

                  {listQuery.isError ? (
                    <ErrorState
                      message="Không thể tải danh sách hiệu quả sản phẩm."
                      onRetry={() => void listQuery.refetch()}
                    />
                  ) : isTableEmpty && !listQuery.isLoading ? (
                    isFilterActive ? (
                      <EmptyState title="Không tìm thấy sản phẩm phù hợp." />
                    ) : (
                      <EmptyState title="Chưa có dữ liệu bán hàng trong khoảng thời gian này." />
                    )
                  ) : (
                    // Dimmed (not replaced by a skeleton) while a filter/sort/
                    // page change is refetching — `keepPreviousData` keeps the
                    // previous rows on screen, and this dimming is what makes
                    // clear they're not yet the new selection's result
                    // (requirement §56).
                    <div className={cn(listQuery.isFetching && 'opacity-60 transition-opacity')}>
                      <ProductPerformanceTable
                        data={products}
                        isLoading={listQuery.isLoading}
                        sorting={sorting}
                        onSortingChange={(next) => {
                          setSorting(next)
                          resetToFirstPage()
                        }}
                        pagination={{
                          pageIndex: page,
                          pageSize,
                          total,
                          onPageChange: setPage,
                          pageSizeOptions: PAGE_SIZE_OPTIONS,
                          onPageSizeChange: (nextPageSize) => {
                            setPageSize(nextPageSize)
                            resetToFirstPage()
                          },
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-tour="product-performance-category">
                <CardHeader>
                  <CardTitle>Hiệu quả theo danh mục</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryQuery.isError ? (
                    <ErrorState
                      message="Không thể tải hiệu quả theo danh mục."
                      onRetry={() => void categoryQuery.refetch()}
                    />
                  ) : categoryQuery.isLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : (
                    <CategoryPerformanceTable data={categoryQuery.data ?? []} />
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </PageContent>
  )
}

export { ProductPerformanceReportPage }
