import { Link } from 'react-router'
import { AlertTriangle, ArrowLeft, PiggyBank, Receipt, TrendingDown, TrendingUp } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { ROUTES } from '@/routes/route-paths'
import { KpiCard } from '@/features/reports/components/kpi-card'
import { ProfitChart } from '@/features/reports/components/profit-chart'
import { ProfitDailyTable } from '@/features/reports/components/profit-daily-table'
import { ReportDateRangePicker } from '@/features/reports/components/report-date-range-picker'
import { useReportDateRangeStore } from '@/features/reports/hooks/use-report-date-range-store'
import { useProfitSummary } from '@/features/reports/hooks/use-profit-summary'
import { useProfitTimeseries } from '@/features/reports/hooks/use-profit-timeseries'
import { findBestProfitDay } from '@/features/reports/utils/best-profit-day'
import { formatPercent, safeRatio } from '@/features/reports/utils/format-percent'
import { isValidReportDateRange } from '@/features/reports/utils/report-date-range'

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
 * Profit Report (Phase 7.3). Gross Profit only — Revenue minus the
 * historical cost of goods actually sold — never Net Profit (no operating
 * expenses/salaries/rent/tax deducted anywhere here, requirement §53).
 * Every number comes from `get_profit_summary()`/`get_profit_timeseries()`,
 * both already scoped to `status = 'completed'` with `completed_at` as the
 * business date and COGS computed strictly from the historical
 * `order_item_batches.unit_cost` snapshot (see their migration comments) —
 * nothing here recomputes, re-filters, or falls back to a current
 * product/batch purchase price.
 *
 * "Tổng doanh thu" here is defined identically to, and reconciles exactly
 * with, the Revenue Report's own total for the same range (verified while
 * building this phase — see the completion report) — this page never
 * introduces a second revenue definition.
 *
 * The date range is the shared `useReportDateRangeStore` from Phase 7.1,
 * same as Revenue Report — one picker, reused across every report page.
 */
function ProfitReportPage() {
  const range = useReportDateRangeStore((state) => state.range)
  const setPreset = useReportDateRangeStore((state) => state.setPreset)
  const setCustomRange = useReportDateRangeStore((state) => state.setCustomRange)

  const summaryQuery = useProfitSummary(range)
  const timeseriesQuery = useProfitTimeseries(range)

  const isRangeValid = isValidReportDateRange(range)
  const bestDay = timeseriesQuery.data ? findBestProfitDay(timeseriesQuery.data) : null
  const grossMargin = formatPercent(safeRatio(summaryQuery.data?.grossProfit ?? 0, summaryQuery.data?.totalRevenue ?? 0))
  const missingCostCount = summaryQuery.data?.ordersWithMissingCost ?? 0

  return (
    <PageContent>
      <BackLink />

      <PageHeader
        title="Lợi nhuận"
        description="Lợi nhuận gộp dựa trên giá vốn thực tế của từng lô hàng đã bán, không phải giá nhập hiện tại."
      />

      <div className="space-y-2" data-tour="profit-date-range">
        <ReportDateRangePicker
          value={range}
          onChange={(next) =>
            next.preset === 'custom' ? setCustomRange(next.from, next.to) : setPreset(next.preset)
          }
        />
      </div>

      {isRangeValid && (
        <>
          {/* Defense-in-depth only — `complete_order()` guarantees full cost
             allocation for every completed order (see the RPC's migration
             comment), so this is expected to never render in practice. It
             stays here so a future data anomaly is visible rather than
             silently inflating Gross Profit (requirement §20). */}
          {missingCostCount > 0 && (
            <Alert variant="warning">
              <AlertTriangle />
              <AlertTitle>Dữ liệu giá vốn chưa đầy đủ</AlertTitle>
              <AlertDescription>
                {missingCostCount === 1
                  ? '1 đơn hàng có dữ liệu giá vốn chưa đầy đủ trong khoảng thời gian này — số liệu lợi nhuận có thể chưa chính xác.'
                  : `${missingCostCount} đơn hàng có dữ liệu giá vốn chưa đầy đủ trong khoảng thời gian này — số liệu lợi nhuận có thể chưa chính xác.`}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-tour="profit-kpis">
            <KpiCard
              title="Doanh thu"
              value={formatCurrencyVND(summaryQuery.data?.totalRevenue ?? 0)}
              icon={TrendingUp}
              isLoading={summaryQuery.isLoading}
            />
            <KpiCard
              title="Giá vốn"
              value={formatCurrencyVND(summaryQuery.data?.totalCogs ?? 0)}
              icon={TrendingDown}
              isLoading={summaryQuery.isLoading}
            />
            <KpiCard
              title="Lợi nhuận gộp"
              value={formatCurrencyVND(summaryQuery.data?.grossProfit ?? 0)}
              icon={PiggyBank}
              isLoading={summaryQuery.isLoading}
              className={
                !summaryQuery.isLoading && (summaryQuery.data?.grossProfit ?? 0) < 0
                  ? 'border-destructive/40'
                  : undefined
              }
            />
            <KpiCard
              title="Biên lợi nhuận"
              value={grossMargin}
              subtitle={`${summaryQuery.data?.completedOrderCount ?? 0} đơn hàng`}
              icon={Receipt}
              isLoading={summaryQuery.isLoading}
            />
          </div>

          {summaryQuery.isError && (
            <ErrorState message="Không thể tải dữ liệu lợi nhuận." onRetry={() => void summaryQuery.refetch()} />
          )}

          <Card data-tour="profit-chart">
            <CardHeader>
              <CardTitle>Lợi nhuận theo thời gian</CardTitle>
              {bestDay && (
                <p className="text-sm text-muted-foreground">
                  Ngày lợi nhuận cao nhất: {formatDate(bestDay.reportDate)} · {formatCurrencyVND(bestDay.grossProfit)}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {timeseriesQuery.isError ? (
                <ErrorState
                  message="Không thể tải biểu đồ lợi nhuận."
                  onRetry={() => void timeseriesQuery.refetch()}
                />
              ) : timeseriesQuery.isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : !timeseriesQuery.data || timeseriesQuery.data.every((point) => point.orderCount === 0) ? (
                <EmptyState title="Chưa có dữ liệu lợi nhuận trong khoảng thời gian này." />
              ) : (
                <>
                  <ProfitChart data={timeseriesQuery.data} />
                  <ProfitDailyTable data={timeseriesQuery.data} />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageContent>
  )
}

export { ProfitReportPage }
