import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import type { RevenueDailyPoint } from '@/features/reports/types/revenue'

const columns: DataTableColumn<RevenueDailyPoint>[] = [
  { id: 'date', header: 'Ngày', cell: (point) => formatDate(point.reportDate) },
  { id: 'order_count', header: 'Số đơn', align: 'right', cell: (point) => formatNumber(point.orderCount) },
  {
    id: 'revenue',
    header: 'Doanh thu',
    align: 'right',
    cell: (point) => <span className="font-medium text-foreground">{formatCurrencyVND(point.revenue)}</span>,
  },
  {
    id: 'average',
    header: 'Giá trị đơn TB',
    align: 'right',
    // A day with 0 orders has no meaningful average — "—", not "0 ₫" (which
    // would read as "orders sold for free" rather than "no orders").
    cell: (point) => (point.orderCount > 0 ? formatCurrencyVND(Math.round(point.revenue / point.orderCount)) : '—'),
  },
]

/**
 * Compact daily breakdown (Phase 7.2) — same shared `data` as
 * `RevenueChart` (requirement §20: no redundant query "for the table"),
 * just re-sorted newest-first for quick operational reading (the chart
 * stays chronological left-to-right; see its own doc comment). Doubles as
 * the accessible, non-visual way to read the same data the chart shows
 * (requirement §45).
 */
export function RevenueDailyTable({ data }: { data: RevenueDailyPoint[] }) {
  const rowsNewestFirst = [...data].reverse()

  return (
    <DataTable columns={columns} data={rowsNewestFirst} getRowId={(point) => point.reportDate} />
  )
}
