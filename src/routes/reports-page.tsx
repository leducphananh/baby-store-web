import type { ComponentType } from 'react'
import { Link } from 'react-router'
import { Boxes, CalendarClock, LineChart, PiggyBank, Star } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { ROUTES } from '@/routes/route-paths'
import { ReportDateRangePicker } from '@/features/reports/components/report-date-range-picker'
import { useReportDateRangeStore } from '@/features/reports/hooks/use-report-date-range-store'

type ReportCatalogEntry = {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  /** Set once the report page actually exists — turns the card into a real link with no "Sắp ra mắt" badge. Omit for a still-unimplemented module (requirement §19/§32). */
  path?: string
}

/**
 * Report modules. Only "Doanh thu" is implemented (Phase 7.2) — the rest
 * stay exactly as Phase 7.1 left them: shown as "Sắp ra mắt" with no link,
 * since a nonfunctional route/click target would be worse than an honest
 * roadmap. Add `path` and the card activates itself automatically, the
 * same one-line-at-a-time pattern `nav-items.ts` uses for the sidebar —
 * turn on one report per phase, never all at once.
 */
const REPORT_CATALOG: ReportCatalogEntry[] = [
  {
    title: 'Doanh thu',
    description: 'Doanh thu theo ngày/tuần/tháng từ các đơn hàng đã hoàn tất.',
    icon: LineChart,
    path: ROUTES.revenueReport,
  },
  { title: 'Lợi nhuận', description: 'Lợi nhuận gộp dựa trên giá vốn thực tế của từng lô hàng đã bán.', icon: PiggyBank },
  { title: 'Hiệu quả sản phẩm', description: 'Sản phẩm bán chạy, doanh thu và lợi nhuận theo từng sản phẩm.', icon: Star },
  { title: 'Tồn kho', description: 'Số lượng và giá trị tồn kho hiện tại theo từng sản phẩm/lô hàng.', icon: Boxes },
  { title: 'Hạn sử dụng', description: 'Thống kê lô hàng đã hết hạn hoặc sắp hết hạn theo thời gian.', icon: CalendarClock },
]

function ReportCard({ title, description, icon: Icon, path }: ReportCatalogEntry) {
  const content = (
    <CardContent className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Icon className="size-6 text-muted-foreground" />
        {!path && <Badge variant="secondary">Sắp ra mắt</Badge>}
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  )

  if (!path) {
    return <Card className="opacity-75">{content}</Card>
  }

  // `Card` is a plain `<div>` (no Radix `Slot`/`asChild` support — see
  // `components/ui/card.tsx`), so a linked card can't be `<Card asChild>`;
  // its own classes are applied directly to the `<Link>` instead, keeping
  // the exact same visual shape.
  return (
    <Link
      to={path}
      aria-label={`Xem báo cáo ${title}`}
      className="flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-soft transition-shadow hover:shadow-md"
    >
      {content}
    </Link>
  )
}

/**
 * Reports landing page. Real KPI/chart data only ever lives on a report's
 * own page (Doanh thu — Phase 7.2); this page itself never computes or
 * shows a business number, real or fake (requirement §52) — just
 * navigation and the shared reporting date-range control every report page
 * reads (`dashboard-ui` skill rule 6).
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
          Lựa chọn này sẽ được áp dụng khi mở một báo cáo bên dưới.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-tour="reports-catalog">
        {REPORT_CATALOG.map((entry) => (
          <ReportCard key={entry.title} {...entry} />
        ))}
      </div>
    </PageContent>
  )
}

export { ReportsPage }
