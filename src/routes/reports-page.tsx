import type { ComponentType } from 'react'
import { Boxes, CalendarClock, LineChart, PiggyBank, Star } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { ReportDateRangePicker } from '@/features/reports/components/report-date-range-picker'
import { useReportDateRangeStore } from '@/features/reports/hooks/use-report-date-range-store'

type ReportCatalogEntry = {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}

/**
 * Future Phase 7.x report modules. None are implemented yet (Phase 7.1 is
 * foundation only — CLAUDE.md §14 phase discipline), so every card is shown
 * as "Sắp ra mắt" with no link — a nonfunctional route/click target would
 * be worse than an honest roadmap (requirement §19). Add a real `path` +
 * turn a card into a `<Link>` only once its report page actually exists,
 * the same one-line-at-a-time pattern `nav-items.ts` already uses for the
 * main sidebar.
 */
const REPORT_CATALOG: ReportCatalogEntry[] = [
  { title: 'Doanh thu', description: 'Doanh thu theo ngày/tuần/tháng từ các đơn hàng đã hoàn tất.', icon: LineChart },
  { title: 'Lợi nhuận', description: 'Lợi nhuận gộp dựa trên giá vốn thực tế của từng lô hàng đã bán.', icon: PiggyBank },
  { title: 'Hiệu quả sản phẩm', description: 'Sản phẩm bán chạy, doanh thu và lợi nhuận theo từng sản phẩm.', icon: Star },
  { title: 'Tồn kho', description: 'Số lượng và giá trị tồn kho hiện tại theo từng sản phẩm/lô hàng.', icon: Boxes },
  { title: 'Hạn sử dụng', description: 'Thống kê lô hàng đã hết hạn hoặc sắp hết hạn theo thời gian.', icon: CalendarClock },
]

/**
 * Reports landing page (Phase 7.1 — foundation). Not a dashboard: no
 * revenue/profit numbers are computed or shown here, real or fake
 * (requirement §52) — just navigation toward future report modules and the
 * shared reporting date-range control every one of them will use.
 *
 * The date-range picker here is fully functional, not a placeholder: it
 * reads/writes `useReportDateRangeStore`, the same shared selection every
 * future report page will read (`dashboard-ui` skill rule 6) — picking a
 * period here is what a store operator would naturally do before opening
 * "Doanh thu" or "Lợi nhuận" once those exist.
 */
function ReportsPage() {
  const range = useReportDateRangeStore((state) => state.range)
  const setPreset = useReportDateRangeStore((state) => state.setPreset)
  const setCustomRange = useReportDateRangeStore((state) => state.setCustomRange)

  return (
    <PageContent>
      <PageHeader
        title="Báo cáo"
        description="Theo dõi hoạt động kinh doanh, doanh thu, lợi nhuận và tồn kho."
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Khoảng thời gian</p>
        <ReportDateRangePicker
          value={range}
          onChange={(next) =>
            next.preset === 'custom' ? setCustomRange(next.from, next.to) : setPreset(next.preset)
          }
        />
        <p className="text-xs text-muted-foreground">
          Lựa chọn này sẽ được áp dụng khi các báo cáo bên dưới được triển khai.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-tour="reports-catalog">
        {REPORT_CATALOG.map(({ title, description, icon: Icon }) => (
          <Card key={title} className="opacity-75">
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Icon className="size-6 text-muted-foreground" />
                <Badge variant="secondary">Sắp ra mắt</Badge>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContent>
  )
}

export { ReportsPage }
