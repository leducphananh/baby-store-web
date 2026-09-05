import { Link } from 'react-router'
import { ArrowRight, Boxes, PackageX, TrendingDown, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/common/error-state'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import { ROUTES } from '@/routes/route-paths'
import { KpiCard } from '@/features/reports/components/kpi-card'
import { useInventoryValueSummary } from '@/features/reports/hooks/use-inventory-value-summary'

/**
 * "Tồn kho hiện tại" — a CURRENT SNAPSHOT section (requirement §4/§17),
 * deliberately NOT reading the sales date-range store: this section
 * renders the exact same query as Phase 7.5's Inventory Report KPI row
 * (`useInventoryValueSummary()`, no date param at all), so there is no
 * "date range" for it to respond to in the first place — switching the
 * period above between "Tháng này"/"Tháng trước" cannot change anything
 * here (requirement §5/§54/§96).
 *
 * "Cập nhật lúc" reflects this query's own last successful fetch time
 * (`dataUpdatedAt`), not a claim of live/realtime data (requirement
 * §62/§67).
 */
export function InventorySnapshotSection() {
  const summaryQuery = useInventoryValueSummary()

  return (
    <section className="space-y-4" data-tour="dashboard-inventory">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tồn kho hiện tại</h2>
          <p className="text-xs text-muted-foreground">
            Cập nhật lúc {summaryQuery.dataUpdatedAt ? formatDateTime(new Date(summaryQuery.dataUpdatedAt)) : '—'}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={ROUTES.inventoryReport}>
            Xem báo cáo tồn kho
            <ArrowRight />
          </Link>
        </Button>
      </div>

      {summaryQuery.isError ? (
        <ErrorState message="Không thể tải dữ liệu tồn kho." onRetry={() => void summaryQuery.refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-tour="dashboard-inventory-kpis">
          <KpiCard
            title="Giá trị tồn kho"
            value={formatCurrencyVND(summaryQuery.data?.totalInventoryValue ?? 0)}
            icon={Wallet}
            isLoading={summaryQuery.isLoading}
          />
          <KpiCard
            title="Sản phẩm còn hàng"
            value={formatNumber(summaryQuery.data?.productsInStockCount ?? 0)}
            icon={Boxes}
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
      )}
    </section>
  )
}
