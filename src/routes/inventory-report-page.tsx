import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AlertTriangle, ArrowLeft, Boxes, PackageX, RefreshCw, TrendingDown, Wallet } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePersistedPageSize } from '@/hooks/use-persisted-page-size'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/route-paths'
import { KpiCard } from '@/features/reports/components/kpi-card'
import { InventoryCategoryChart } from '@/features/reports/components/inventory-category-chart'
import { InventoryCategoryTable } from '@/features/reports/components/inventory-category-table'
import { InventoryReportFilters } from '@/features/reports/components/inventory-report-filters'
import { InventoryReportTable } from '@/features/reports/components/inventory-report-table'
import { useInventoryCategorySummary } from '@/features/reports/hooks/use-inventory-category-summary'
import { useInventoryProductList } from '@/features/reports/hooks/use-inventory-product-list'
import { useInventoryValueSummary } from '@/features/reports/hooks/use-inventory-value-summary'
import type { InventoryReportSortField, StockStatusFilter } from '@/features/reports/types/inventory'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_STORAGE_KEY = 'baby-wale.reports.inventory.page-size'
const VALID_STOCK_STATUS_FILTERS: StockStatusFilter[] = ['all', 'out_of_stock', 'low_stock', 'normal']

/**
 * One-way deep link from the alert Bell/Alert Center/Dashboard
 * (`?stockStatus=out_of_stock`/`low_stock`, Phase 8.2) — read once as the
 * filter's initial value, never synced back to the URL on further filter
 * changes. This is deliberately not a full URL-synced-filter feature (that
 * would need bidirectional state + guard against feedback loops with the
 * `stockStatus` `useState` below); a one-time initial read has no such
 * risk and is all an alert link needs.
 */
function readStockStatusFromUrl(searchParams: URLSearchParams): StockStatusFilter {
  const value = searchParams.get('stockStatus')
  return VALID_STOCK_STATUS_FILTERS.includes(value as StockStatusFilter) ? (value as StockStatusFilter) : 'all'
}

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
 * Inventory Report (Phase 7.5) — a CURRENT-STATE snapshot, not a sales-date-
 * range report (requirement §2): there is deliberately no
 * `ReportDateRangePicker` here, unlike every other report page. "Now" means
 * whatever `product_batches.remaining_quantity` says at the moment this
 * page's queries last ran — the "Cập nhật lúc" timestamp below is that
 * moment, and the refresh button re-runs all three queries on demand.
 *
 * Every number reuses `product_inventory_overview` (Phase 4.6) for current
 * quantity/stock-status/category/nearest-expiry, extended with inventory
 * valuation (`get_inventory_value_summary()`/`get_inventory_product_list()`/
 * `get_inventory_category_summary()` — see their migration comment) — so
 * this report's stock numbers are always identical to the Inventory
 * Dashboard's, by construction. Inventory Value is the historical
 * acquisition cost of remaining stock (`SUM(batch.remaining_quantity *
 * batch.purchase_price)`), never current product/supplier price, and never
 * an estimated sales value (requirement §35/§36).
 */
function InventoryReportPage() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [stockStatus, setStockStatus] = useState<StockStatusFilter>(() => readStockStatusFromUrl(searchParams))
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = usePersistedPageSize(PAGE_SIZE_STORAGE_KEY, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE)
  const [sorting, setSorting] = useState<{ id: InventoryReportSortField; desc: boolean }>({
    id: 'inventory_value',
    desc: true,
  })
  const debouncedSearch = useDebouncedValue(search, 300)

  function resetToFirstPage() {
    setPage(1)
  }

  const listFilters = {
    search: debouncedSearch,
    categoryId,
    stockStatus,
    sortField: sorting.id,
    sortDesc: sorting.desc,
    page,
    pageSize,
  }

  const summaryQuery = useInventoryValueSummary()
  const listQuery = useInventoryProductList(listFilters)
  const categoryQuery = useInventoryCategorySummary()

  function refreshAll() {
    void summaryQuery.refetch()
    void listQuery.refetch()
    void categoryQuery.refetch()
  }

  const products = listQuery.data?.data ?? []
  const total = listQuery.data?.total ?? 0
  const hasAnyInventory = (summaryQuery.data?.productsInStockCount ?? 0) > 0
  const isFilterActive = debouncedSearch.trim().length > 0 || categoryId !== null || stockStatus !== 'all'
  const isTableEmpty = products.length === 0
  const orphanCount = summaryQuery.data?.orphanBatchCount ?? 0
  const isAnyFetching = summaryQuery.isFetching || listQuery.isFetching || categoryQuery.isFetching

  return (
    <PageContent>
      <BackLink />

      <PageHeader
        title="Tồn kho"
        description="Giá trị tồn kho được tính theo giá nhập thực tế của từng lô hàng còn lại — báo cáo này thể hiện tồn kho hiện tại, không phụ thuộc khoảng thời gian bán hàng."
        actions={
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isAnyFetching}>
            <RefreshCw className={cn('size-4', isAnyFetching && 'animate-spin')} />
            Làm mới
          </Button>
        }
      />

      <p className="text-xs text-muted-foreground" data-tour="inventory-report-snapshot">
        Cập nhật lúc {summaryQuery.dataUpdatedAt ? formatDateTime(new Date(summaryQuery.dataUpdatedAt)) : '—'}
      </p>

      {orphanCount > 0 && (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertTitle>Dữ liệu lô hàng chưa đầy đủ</AlertTitle>
          <AlertDescription>
            {orphanCount === 1
              ? '1 lô hàng chưa được gắn với sản phẩm nào — giá trị tồn kho có thể chưa đầy đủ.'
              : `${orphanCount} lô hàng chưa được gắn với sản phẩm nào — giá trị tồn kho có thể chưa đầy đủ.`}
          </AlertDescription>
        </Alert>
      )}

      {summaryQuery.isError && (
        <ErrorState message="Không thể tải báo cáo tồn kho." onRetry={() => void summaryQuery.refetch()} />
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5" data-tour="inventory-report-kpis">
        <KpiCard
          title="Sản phẩm còn hàng"
          value={formatNumber(summaryQuery.data?.productsInStockCount ?? 0)}
          icon={Boxes}
          isLoading={summaryQuery.isLoading}
        />
        <KpiCard
          title="Tổng đơn vị tồn"
          value={formatNumber(summaryQuery.data?.totalUnits ?? 0)}
          subtitle="Cộng dồn theo số lượng, không phân biệt đơn vị tính"
          icon={Boxes}
          isLoading={summaryQuery.isLoading}
        />
        <KpiCard
          title="Giá trị tồn kho"
          value={formatCurrencyVND(summaryQuery.data?.totalInventoryValue ?? 0)}
          icon={Wallet}
          isLoading={summaryQuery.isLoading}
        />
        <KpiCard
          title="Sắp hết hàng"
          value={formatNumber(summaryQuery.data?.lowStockCount ?? 0)}
          icon={TrendingDown}
          isLoading={summaryQuery.isLoading}
        />
        <KpiCard
          title="Hết hàng"
          value={formatNumber(summaryQuery.data?.outOfStockCount ?? 0)}
          icon={PackageX}
          isLoading={summaryQuery.isLoading}
        />
      </div>

      {!summaryQuery.isLoading && !summaryQuery.isError && !hasAnyInventory ? (
        <EmptyState title="Chưa có hàng tồn kho." />
      ) : (
        <>
          <Card data-tour="inventory-report-category">
            <CardHeader>
              <CardTitle>Giá trị tồn kho theo danh mục</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {categoryQuery.isError ? (
                <ErrorState
                  message="Không thể tải hiệu quả theo danh mục."
                  onRetry={() => void categoryQuery.refetch()}
                />
              ) : categoryQuery.isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <>
                  <InventoryCategoryChart data={categoryQuery.data ?? []} />
                  <InventoryCategoryTable data={categoryQuery.data ?? []} />
                </>
              )}
            </CardContent>
          </Card>

          <Card data-tour="inventory-report-table">
            <CardHeader>
              <CardTitle>Chi tiết theo sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InventoryReportFilters
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
                stockStatus={stockStatus}
                onStockStatusChange={(value) => {
                  setStockStatus(value)
                  resetToFirstPage()
                }}
              />

              {listQuery.isError ? (
                <ErrorState message="Không thể tải báo cáo tồn kho." onRetry={() => void listQuery.refetch()} />
              ) : isTableEmpty && !listQuery.isLoading ? (
                isFilterActive ? (
                  <EmptyState title="Không tìm thấy sản phẩm phù hợp." />
                ) : (
                  <EmptyState title="Chưa có hàng tồn kho." />
                )
              ) : (
                // Dimmed (not replaced by a skeleton) while a filter/sort/page
                // change is refetching — `keepPreviousData` keeps the previous
                // rows on screen, and this dimming makes clear they're not yet
                // the new selection's result.
                <div className={cn(listQuery.isFetching && 'opacity-60 transition-opacity')}>
                  <InventoryReportTable
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
        </>
      )}
    </PageContent>
  )
}

export { InventoryReportPage }
