import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AlertTriangle, ArrowLeft, Clock, HelpCircle, PackageX, RefreshCw, Wallet } from 'lucide-react'

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
import { DayCountSelector } from '@/features/reports/components/day-count-selector'
import { ExpiryBatchFilters } from '@/features/reports/components/expiry-batch-filters'
import { ExpiryBatchTable } from '@/features/reports/components/expiry-batch-table'
import { ExpiryBucketChart } from '@/features/reports/components/expiry-bucket-chart'
import { KpiCard } from '@/features/reports/components/kpi-card'
import { SlowMovingFilters } from '@/features/reports/components/slow-moving-filters'
import { SlowMovingTable } from '@/features/reports/components/slow-moving-table'
import { useExpiryBatchList } from '@/features/reports/hooks/use-expiry-batch-list'
import { useExpiryBucketSummary } from '@/features/reports/hooks/use-expiry-bucket-summary'
import { useExpirySummary } from '@/features/reports/hooks/use-expiry-summary'
import { useSlowMovingProducts } from '@/features/reports/hooks/use-slow-moving-products'
import { useSlowMovingSummary } from '@/features/reports/hooks/use-slow-moving-summary'
import type {
  ExpiryBatchSortField,
  ExpiryHorizonDays,
  ExpiryStatusFilter,
  SalesLookbackDays,
  SlowMovingSortField,
} from '@/features/reports/types/expiry'

const EXPIRY_HORIZON_OPTIONS: readonly ExpiryHorizonDays[] = [7, 30, 60, 90]
const LOOKBACK_OPTIONS: readonly SalesLookbackDays[] = [30, 60, 90]
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const DEFAULT_PAGE_SIZE = 10
const EXPIRY_PAGE_SIZE_STORAGE_KEY = 'baby-wale.reports.expiry.page-size'
const SLOW_MOVING_PAGE_SIZE_STORAGE_KEY = 'baby-wale.reports.slow-moving.page-size'
const VALID_EXPIRY_STATUS_FILTERS: ExpiryStatusFilter[] = ['all', 'expired', 'near_expiry', 'missing_expiry']

/**
 * One-way deep link from the alert Bell/Alert Center/Dashboard
 * (`?expiryStatus=expired|near_expiry|missing_expiry`, Phase 8.3) — read
 * once as the batch table's initial filter, never synced back to the URL
 * (same pattern as the Inventory Report's `?stockStatus=`, Phase 8.2).
 */
function readExpiryStatusFromUrl(searchParams: URLSearchParams): ExpiryStatusFilter {
  const value = searchParams.get('expiryStatus')
  return VALID_EXPIRY_STATUS_FILTERS.includes(value as ExpiryStatusFilter) ? (value as ExpiryStatusFilter) : 'all'
}

/**
 * `?horizon=30` (only sent alongside the `expiring_soon` alert link) —
 * initializes the report's own user-selectable horizon to the same
 * operational default the alert used, so the batches shown match what the
 * alert counted. Falls back to the report's own default (30) for any
 * missing/invalid value, never a silently-different horizon.
 */
function readHorizonFromUrl(searchParams: URLSearchParams): ExpiryHorizonDays {
  const value = Number(searchParams.get('horizon'))
  return (EXPIRY_HORIZON_OPTIONS as readonly number[]).includes(value) ? (value as ExpiryHorizonDays) : 30
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
 * Expiry & Slow-moving Report (Phase 7.6) — two deliberately separate,
 * independently-scrollable sections (requirement §2/§19), neither using
 * the shared `ReportDateRangePicker`: both are current-inventory snapshots
 * parameterized by a horizon/lookback the operator picks, never a sales
 * date range (requirement §20/§56).
 *
 * Expiry section: "Hạn sử dụng trong" is a REPORT FILTER (7/30/60/90 ngày),
 * not a permanent "near-expiry = dangerous" business rule — 30 is only the
 * pre-existing app-wide default (`EXPIRING_SOON_DAYS`, Phase 4) reused for
 * convenience (requirement §8). The chart always shows the FULL current
 * inventory distribution regardless of the selected horizon; only the KPIs
 * and batch table are horizon-scoped.
 *
 * Slow-moving section: no hidden "chậm bán" threshold exists in this app,
 * so nothing here classifies a product as slow-moving — only factual
 * current-inventory + recent-sales metrics are shown, and the operator
 * decides what counts as worth checking (requirement §22/§67/§73).
 */
function ExpiryReportPage() {
  const [searchParams] = useSearchParams()
  const [horizonDays, setHorizonDays] = useState<ExpiryHorizonDays>(() => readHorizonFromUrl(searchParams))
  const [expirySearch, setExpirySearch] = useState('')
  const [expiryCategoryId, setExpiryCategoryId] = useState<string | null>(null)
  const [expiryStatusFilter, setExpiryStatusFilter] = useState<ExpiryStatusFilter>(() =>
    readExpiryStatusFromUrl(searchParams),
  )
  const [expiryPage, setExpiryPage] = useState(1)
  const [expiryPageSize, setExpiryPageSize] = usePersistedPageSize(
    EXPIRY_PAGE_SIZE_STORAGE_KEY,
    PAGE_SIZE_OPTIONS,
    DEFAULT_PAGE_SIZE,
  )
  const [expirySorting, setExpirySorting] = useState<{ id: ExpiryBatchSortField; desc: boolean }>({
    id: 'expiration_date',
    desc: false,
  })
  const debouncedExpirySearch = useDebouncedValue(expirySearch, 300)

  const [lookbackDays, setLookbackDays] = useState<SalesLookbackDays>(30)
  const [smSearch, setSmSearch] = useState('')
  const [smCategoryId, setSmCategoryId] = useState<string | null>(null)
  const [smPage, setSmPage] = useState(1)
  const [smPageSize, setSmPageSize] = usePersistedPageSize(
    SLOW_MOVING_PAGE_SIZE_STORAGE_KEY,
    PAGE_SIZE_OPTIONS,
    DEFAULT_PAGE_SIZE,
  )
  const [smSorting, setSmSorting] = useState<{ id: SlowMovingSortField; desc: boolean }>({
    id: 'last_sold_at',
    desc: false,
  })
  const debouncedSmSearch = useDebouncedValue(smSearch, 300)

  function resetExpiryPage() {
    setExpiryPage(1)
  }
  function resetSmPage() {
    setSmPage(1)
  }

  const expiryBatchFilters = {
    horizonDays,
    search: debouncedExpirySearch,
    categoryId: expiryCategoryId,
    statusFilter: expiryStatusFilter,
    sortField: expirySorting.id,
    sortDesc: expirySorting.desc,
    page: expiryPage,
    pageSize: expiryPageSize,
  }
  const slowMovingFilters = {
    lookbackDays,
    search: debouncedSmSearch,
    categoryId: smCategoryId,
    sortField: smSorting.id,
    sortDesc: smSorting.desc,
    page: smPage,
    pageSize: smPageSize,
  }

  const bucketQuery = useExpiryBucketSummary()
  const expirySummaryQuery = useExpirySummary(horizonDays)
  const expiryListQuery = useExpiryBatchList(expiryBatchFilters)
  const smSummaryQuery = useSlowMovingSummary(lookbackDays)
  const smListQuery = useSlowMovingProducts(slowMovingFilters)

  function refreshAll() {
    void bucketQuery.refetch()
    void expirySummaryQuery.refetch()
    void expiryListQuery.refetch()
    void smSummaryQuery.refetch()
    void smListQuery.refetch()
  }

  const isAnyFetching =
    bucketQuery.isFetching || expirySummaryQuery.isFetching || expiryListQuery.isFetching ||
    smSummaryQuery.isFetching || smListQuery.isFetching

  const expiryRows = expiryListQuery.data?.data ?? []
  const expiryTotal = expiryListQuery.data?.total ?? 0
  const isExpiryFilterActive =
    debouncedExpirySearch.trim().length > 0 || expiryCategoryId !== null || expiryStatusFilter !== 'all'
  const hasAnyExpiryRisk =
    (expirySummaryQuery.data?.expiredBatchCount ?? 0) > 0 ||
    (expirySummaryQuery.data?.nearExpiryBatchCount ?? 0) > 0 ||
    (expirySummaryQuery.data?.missingExpiryBatchCount ?? 0) > 0

  const smRows = smListQuery.data?.data ?? []
  const smTotal = smListQuery.data?.total ?? 0
  const isSmFilterActive = debouncedSmSearch.trim().length > 0 || smCategoryId !== null

  return (
    <PageContent>
      <BackLink />

      <PageHeader
        title="Hạn sử dụng & hàng chậm bán"
        description="Theo dõi hàng sắp hết hạn và các sản phẩm ít phát sinh bán."
        actions={
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isAnyFetching}>
            <RefreshCw className={cn('size-4', isAnyFetching && 'animate-spin')} />
            Làm mới
          </Button>
        }
      />

      <p className="text-xs text-muted-foreground">
        Dữ liệu tính đến{' '}
        {bucketQuery.dataUpdatedAt ? formatDateTime(new Date(bucketQuery.dataUpdatedAt)) : '—'}
      </p>

      {/* ================= EXPIRY SECTION ================= */}
      <div className="space-y-4 rounded-xl border bg-card p-4" data-tour="expiry-section">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Rủi ro hết hạn</h2>
          <DayCountSelector
            label="Hạn sử dụng trong"
            value={horizonDays}
            options={EXPIRY_HORIZON_OPTIONS}
            onChange={setHorizonDays}
            ariaLabel="Chọn khoảng thời gian sắp hết hạn"
          />
        </div>

        {(expirySummaryQuery.data?.missingExpiryBatchCount ?? 0) > 0 && (
          <Alert variant="warning">
            <AlertTriangle />
            <AlertTitle>Lô hàng chưa có hạn sử dụng</AlertTitle>
            <AlertDescription>
              {expirySummaryQuery.data?.missingExpiryBatchCount === 1
                ? '1 lô hàng còn tồn chưa có hạn sử dụng.'
                : `${expirySummaryQuery.data?.missingExpiryBatchCount} lô hàng còn tồn chưa có hạn sử dụng.`}{' '}
              Đây không được xem là an toàn — hãy kiểm tra và bổ sung hạn sử dụng nếu có thể.
            </AlertDescription>
          </Alert>
        )}

        {expirySummaryQuery.isError && (
          <ErrorState message="Không thể tải dữ liệu hạn sử dụng." onRetry={() => void expirySummaryQuery.refetch()} />
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-tour="expiry-kpis">
          <KpiCard
            title="Lô đã hết hạn"
            value={formatNumber(expirySummaryQuery.data?.expiredBatchCount ?? 0)}
            subtitle={`${formatNumber(expirySummaryQuery.data?.expiredQuantity ?? 0)} đơn vị còn tồn`}
            icon={PackageX}
            isLoading={expirySummaryQuery.isLoading}
          />
          <KpiCard
            title="Giá trị hàng đã hết hạn"
            value={formatCurrencyVND(expirySummaryQuery.data?.expiredInventoryValue ?? 0)}
            icon={Wallet}
            isLoading={expirySummaryQuery.isLoading}
          />
          <KpiCard
            title={`Sắp hết hạn trong ${horizonDays} ngày`}
            value={formatNumber(expirySummaryQuery.data?.nearExpiryBatchCount ?? 0)}
            subtitle={`${formatNumber(expirySummaryQuery.data?.nearExpiryQuantity ?? 0)} đơn vị còn tồn`}
            icon={Clock}
            isLoading={expirySummaryQuery.isLoading}
          />
          <KpiCard
            title="Giá trị sắp hết hạn"
            value={formatCurrencyVND(expirySummaryQuery.data?.nearExpiryInventoryValue ?? 0)}
            icon={Wallet}
            isLoading={expirySummaryQuery.isLoading}
          />
        </div>

        <Card data-tour="expiry-chart">
          <CardHeader>
            <CardTitle>Giá trị tồn kho theo thời gian đến hạn sử dụng</CardTitle>
          </CardHeader>
          <CardContent>
            {bucketQuery.isError ? (
              <ErrorState message="Không thể tải dữ liệu hạn sử dụng." onRetry={() => void bucketQuery.refetch()} />
            ) : bucketQuery.isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ExpiryBucketChart data={bucketQuery.data ?? []} />
            )}
          </CardContent>
        </Card>

        <Card data-tour="expiry-table">
          <CardHeader>
            <CardTitle>Chi tiết theo lô hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ExpiryBatchFilters
              search={expirySearch}
              onSearchChange={(value) => {
                setExpirySearch(value)
                resetExpiryPage()
              }}
              categoryId={expiryCategoryId}
              onCategoryChange={(value) => {
                setExpiryCategoryId(value)
                resetExpiryPage()
              }}
              statusFilter={expiryStatusFilter}
              onStatusFilterChange={(value) => {
                setExpiryStatusFilter(value)
                resetExpiryPage()
              }}
            />

            {expiryListQuery.isError ? (
              <ErrorState
                message="Không thể tải dữ liệu hạn sử dụng."
                onRetry={() => void expiryListQuery.refetch()}
              />
            ) : expiryRows.length === 0 && !expiryListQuery.isLoading ? (
              isExpiryFilterActive ? (
                <EmptyState title="Không tìm thấy sản phẩm phù hợp." />
              ) : !hasAnyExpiryRisk ? (
                <EmptyState title="Không có lô hàng hết hạn hoặc sắp hết hạn trong khoảng đã chọn." />
              ) : (
                <EmptyState title="Không có lô hàng phù hợp." />
              )
            ) : (
              <div className={cn(expiryListQuery.isFetching && 'opacity-60 transition-opacity')}>
                <ExpiryBatchTable
                  data={expiryRows}
                  isLoading={expiryListQuery.isLoading}
                  sorting={expirySorting}
                  onSortingChange={(next) => {
                    setExpirySorting(next)
                    resetExpiryPage()
                  }}
                  pagination={{
                    pageIndex: expiryPage,
                    pageSize: expiryPageSize,
                    total: expiryTotal,
                    onPageChange: setExpiryPage,
                    pageSizeOptions: PAGE_SIZE_OPTIONS,
                    onPageSizeChange: (nextPageSize) => {
                      setExpiryPageSize(nextPageSize)
                      resetExpiryPage()
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================= SLOW-MOVING SECTION ================= */}
      <div className="space-y-4 rounded-xl border bg-card p-4" data-tour="slow-moving-section">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Phân tích hàng ít luân chuyển</h2>
            <p className="text-sm text-muted-foreground">
              Dựa trên thời gian từ lần bán gần nhất và lượng bán trong khoảng thời gian bạn chọn — hệ
              thống không tự đặt một ngưỡng "chậm bán" cố định.
            </p>
          </div>
          <DayCountSelector
            label="Phân tích bán hàng trong"
            value={lookbackDays}
            options={LOOKBACK_OPTIONS}
            onChange={setLookbackDays}
            ariaLabel="Chọn khoảng thời gian phân tích bán hàng"
          />
        </div>

        {smSummaryQuery.isError && (
          <ErrorState
            message="Không thể tải dữ liệu luân chuyển sản phẩm."
            onRetry={() => void smSummaryQuery.refetch()}
          />
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-tour="slow-moving-kpis">
          <KpiCard
            title="Sản phẩm chưa từng bán"
            value={formatNumber(smSummaryQuery.data?.neverSoldCount ?? 0)}
            icon={HelpCircle}
            isLoading={smSummaryQuery.isLoading}
          />
          <KpiCard
            title="Giá trị tồn chưa từng bán"
            value={formatCurrencyVND(smSummaryQuery.data?.neverSoldValue ?? 0)}
            icon={Wallet}
            isLoading={smSummaryQuery.isLoading}
          />
          <KpiCard
            title={`Không phát sinh bán trong ${lookbackDays} ngày`}
            value={formatNumber(smSummaryQuery.data?.noSaleInLookbackCount ?? 0)}
            icon={Clock}
            isLoading={smSummaryQuery.isLoading}
          />
          <KpiCard
            title="Giá trị tồn không phát sinh bán"
            value={formatCurrencyVND(smSummaryQuery.data?.noSaleInLookbackValue ?? 0)}
            icon={Wallet}
            isLoading={smSummaryQuery.isLoading}
          />
        </div>

        <Card data-tour="slow-moving-table">
          <CardHeader>
            <CardTitle>Chi tiết theo sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SlowMovingFilters
              search={smSearch}
              onSearchChange={(value) => {
                setSmSearch(value)
                resetSmPage()
              }}
              categoryId={smCategoryId}
              onCategoryChange={(value) => {
                setSmCategoryId(value)
                resetSmPage()
              }}
            />

            {smListQuery.isError ? (
              <ErrorState
                message="Không thể tải dữ liệu luân chuyển sản phẩm."
                onRetry={() => void smListQuery.refetch()}
              />
            ) : smRows.length === 0 && !smListQuery.isLoading ? (
              isSmFilterActive ? (
                <EmptyState title="Không tìm thấy sản phẩm phù hợp." />
              ) : (
                <EmptyState title="Chưa có hàng tồn kho để phân tích." />
              )
            ) : (
              <div className={cn(smListQuery.isFetching && 'opacity-60 transition-opacity')}>
                <SlowMovingTable
                  data={smRows}
                  isLoading={smListQuery.isLoading}
                  lookbackDays={lookbackDays}
                  sorting={smSorting}
                  onSortingChange={(next) => {
                    setSmSorting(next)
                    resetSmPage()
                  }}
                  pagination={{
                    pageIndex: smPage,
                    pageSize: smPageSize,
                    total: smTotal,
                    onPageChange: setSmPage,
                    pageSizeOptions: PAGE_SIZE_OPTIONS,
                    onPageSizeChange: (nextPageSize) => {
                      setSmPageSize(nextPageSize)
                      resetSmPage()
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}

export { ExpiryReportPage }
