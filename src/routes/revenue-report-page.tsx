import { Link } from 'react-router'
import { ArrowLeft, Receipt, ShoppingCart, TrendingUp, Wallet, Clock } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import { ROUTES } from '@/routes/route-paths'
import { KpiCard } from '@/features/reports/components/kpi-card'
import { ReportDateRangePicker } from '@/features/reports/components/report-date-range-picker'
import { RevenueChart } from '@/features/reports/components/revenue-chart'
import { RevenueDailyTable } from '@/features/reports/components/revenue-daily-table'
import { useReportDateRangeStore } from '@/features/reports/hooks/use-report-date-range-store'
import { useRevenueSummary } from '@/features/reports/hooks/use-revenue-summary'
import { useRevenueTimeseries } from '@/features/reports/hooks/use-revenue-timeseries'
import { findBestRevenueDay } from '@/features/reports/utils/best-revenue-day'
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
 * Revenue Report (Phase 7.2). "Doanh thu chỉ tính các đơn đã hoàn tất" —
 * every number on this page comes from `get_revenue_summary()`/
 * `get_revenue_timeseries()`, both already scoped to `status = 'completed'`
 * with `completed_at` as the business date (see their migration comments);
 * nothing here recomputes or re-filters that rule. "Đã thu"/"Chưa thu"
 * answer "of the orders completed in this period, how much has been
 * collected" — not a cashflow-by-payment-date figure (see
 * `get_revenue_summary()`'s own doc comment).
 *
 * The date range is the shared `useReportDateRangeStore` from Phase 7.1 —
 * one picker controls the KPIs, the chart, and the table together, never a
 * separate filter per widget (requirement §35).
 */
function RevenueReportPage() {
  const range = useReportDateRangeStore((state) => state.range)
  const setPreset = useReportDateRangeStore((state) => state.setPreset)
  const setCustomRange = useReportDateRangeStore((state) => state.setCustomRange)

  const summaryQuery = useRevenueSummary(range)
  const timeseriesQuery = useRevenueTimeseries(range)

  const isRangeValid = isValidReportDateRange(range)
  const bestDay = timeseriesQuery.data ? findBestRevenueDay(timeseriesQuery.data) : null

  return (
    <PageContent>
      <BackLink />

      <PageHeader title="Doanh thu" description="Theo dõi doanh thu từ các đơn hàng đã hoàn tất." />

      <div className="space-y-2" data-tour="revenue-date-range">
        <ReportDateRangePicker
          value={range}
          onChange={(next) =>
            next.preset === 'custom' ? setCustomRange(next.from, next.to) : setPreset(next.preset)
          }
        />
      </div>

      {isRangeValid && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5" data-tour="revenue-kpis">
            <KpiCard
              title="Tổng doanh thu"
              value={formatCurrencyVND(summaryQuery.data?.totalRevenue ?? 0)}
              icon={TrendingUp}
              isLoading={summaryQuery.isLoading}
            />
            <KpiCard
              title="Số đơn hàng"
              value={formatNumber(summaryQuery.data?.completedOrderCount ?? 0)}
              icon={ShoppingCart}
              isLoading={summaryQuery.isLoading}
            />
            <KpiCard
              title="Giá trị đơn TB"
              value={formatCurrencyVND(summaryQuery.data?.averageOrderValue ?? 0)}
              icon={Receipt}
              isLoading={summaryQuery.isLoading}
            />
            <KpiCard
              title="Đã thu"
              value={formatCurrencyVND(summaryQuery.data?.paidAmount ?? 0)}
              icon={Wallet}
              isLoading={summaryQuery.isLoading}
            />
            <KpiCard
              title="Còn phải thu"
              value={formatCurrencyVND(summaryQuery.data?.outstandingAmount ?? 0)}
              icon={Clock}
              isLoading={summaryQuery.isLoading}
            />
          </div>

          {summaryQuery.isError && (
            <ErrorState
              message="Không thể tải số liệu doanh thu."
              onRetry={() => void summaryQuery.refetch()}
            />
          )}

          <Card data-tour="revenue-chart">
            <CardHeader>
              <CardTitle>Doanh thu theo thời gian</CardTitle>
              {bestDay && (
                <p className="text-sm text-muted-foreground">
                  Ngày cao nhất: {formatDate(bestDay.reportDate)} · {formatCurrencyVND(bestDay.revenue)}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {timeseriesQuery.isError ? (
                <ErrorState
                  message="Không thể tải biểu đồ doanh thu."
                  onRetry={() => void timeseriesQuery.refetch()}
                />
              ) : timeseriesQuery.isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : !timeseriesQuery.data || timeseriesQuery.data.every((point) => point.orderCount === 0) ? (
                <EmptyState title="Chưa có dữ liệu doanh thu trong khoảng thời gian này." />
              ) : (
                <>
                  <RevenueChart data={timeseriesQuery.data} />
                  <RevenueDailyTable data={timeseriesQuery.data} />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageContent>
  )
}

export { RevenueReportPage }
