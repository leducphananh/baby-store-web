import { Receipt, ShoppingCart, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import { KpiCard } from '@/features/reports/components/kpi-card'
import { ProfitChart } from '@/features/reports/components/profit-chart'
import { ReportDateRangePicker } from '@/features/reports/components/report-date-range-picker'
import { useReportDateRangeStore } from '@/features/reports/hooks/use-report-date-range-store'
import { useProfitSummary } from '@/features/reports/hooks/use-profit-summary'
import { useProfitTimeseries } from '@/features/reports/hooks/use-profit-timeseries'
import { formatPercent, safeRatio } from '@/features/reports/utils/format-percent'
import { isValidReportDateRange } from '@/features/reports/utils/report-date-range'

/**
 * "Kết quả kinh doanh" — the Dashboard's PERIOD section (requirement §4/§6).
 * Reuses `useProfitSummary()`/`useProfitTimeseries()` (Phase 7.3) verbatim
 * — not a second Revenue/Profit formula: `get_profit_summary()` already
 * returns `totalRevenue`/`totalCogs`/`grossProfit` in one call, so this
 * section needs no separate Revenue query (requirement §3/§13) and its
 * numbers are the Profit/Revenue Report's numbers by construction, not by
 * coincidence. The chart reuses `ProfitChart` (Phase 7.3) directly — no
 * new "dashboard revenue/profit chart" component (requirement §12/§13).
 *
 * Shares the same `useReportDateRangeStore` as every report page — picking
 * "Tháng trước" here also changes what Revenue/Profit/Product Performance
 * show if the operator opens them next (established Phase 7.1 behavior,
 * not new). This range affects ONLY this section and Top Products below
 * it — never the current-inventory/expiry sections (requirement §5).
 */
export function BusinessOverviewSection() {
  const range = useReportDateRangeStore((state) => state.range)
  const setPreset = useReportDateRangeStore((state) => state.setPreset)
  const setCustomRange = useReportDateRangeStore((state) => state.setCustomRange)
  const isRangeValid = isValidReportDateRange(range)

  const summaryQuery = useProfitSummary(range)
  const timeseriesQuery = useProfitTimeseries(range)

  const grossMargin = formatPercent(safeRatio(summaryQuery.data?.grossProfit ?? 0, summaryQuery.data?.totalRevenue ?? 0))

  return (
    <section className="space-y-4" data-tour="dashboard-period">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Kết quả kinh doanh</h2>
        <ReportDateRangePicker
          value={range}
          onChange={(next) =>
            next.preset === 'custom' ? setCustomRange(next.from, next.to) : setPreset(next.preset)
          }
        />
      </div>

      {!isRangeValid ? null : (
        <>
          {summaryQuery.isError && (
            <ErrorState
              message="Không thể tải kết quả kinh doanh."
              onRetry={() => void summaryQuery.refetch()}
            />
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-tour="dashboard-kpis">
            <KpiCard
              title="Doanh thu"
              value={formatCurrencyVND(summaryQuery.data?.totalRevenue ?? 0)}
              icon={TrendingUp}
              isLoading={summaryQuery.isLoading}
            />
            <KpiCard
              title="Lợi nhuận gộp"
              value={formatCurrencyVND(summaryQuery.data?.grossProfit ?? 0)}
              icon={Receipt}
              isLoading={summaryQuery.isLoading}
              className={
                !summaryQuery.isLoading && (summaryQuery.data?.grossProfit ?? 0) < 0 ? 'border-destructive/40' : undefined
              }
            />
            <KpiCard title="Biên lợi nhuận" value={grossMargin} icon={Receipt} isLoading={summaryQuery.isLoading} />
            <KpiCard
              title="Đơn hoàn tất"
              value={formatNumber(summaryQuery.data?.completedOrderCount ?? 0)}
              icon={ShoppingCart}
              isLoading={summaryQuery.isLoading}
            />
          </div>

          <Card data-tour="dashboard-chart">
            <CardHeader>
              <CardTitle>Doanh thu & lợi nhuận</CardTitle>
            </CardHeader>
            <CardContent>
              {timeseriesQuery.isError ? (
                <ErrorState
                  message="Không thể tải biểu đồ kết quả kinh doanh."
                  onRetry={() => void timeseriesQuery.refetch()}
                />
              ) : timeseriesQuery.isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : !timeseriesQuery.data || timeseriesQuery.data.every((point) => point.orderCount === 0) ? (
                <EmptyState title="Chưa có dữ liệu bán hàng trong khoảng thời gian này." />
              ) : (
                <ProfitChart data={timeseriesQuery.data} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  )
}
