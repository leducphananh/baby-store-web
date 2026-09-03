import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import { formatPercent, safeRatio } from '@/features/reports/utils/format-percent'
import type { ProfitDailyPoint } from '@/features/reports/types/profit'

const columns: DataTableColumn<ProfitDailyPoint>[] = [
  { id: 'date', header: 'Ngày', cell: (point) => formatDate(point.reportDate) },
  { id: 'order_count', header: 'Số đơn', align: 'right', cell: (point) => formatNumber(point.orderCount) },
  {
    id: 'revenue',
    header: 'Doanh thu',
    align: 'right',
    cell: (point) => <span className="font-medium text-foreground">{formatCurrencyVND(point.revenue)}</span>,
  },
  {
    id: 'cogs',
    header: 'Giá vốn',
    align: 'right',
    cell: (point) => formatCurrencyVND(point.cogs),
  },
  {
    id: 'gross_profit',
    header: 'Lợi nhuận',
    align: 'right',
    cell: (point) => (
      // Negative gross profit stays visible as the real signed value
      // (requirement §26/§29) — a loss-making day is useful information,
      // never hidden or clamped to 0. `--destructive` calls it out visually
      // in addition to the (always-present) minus sign, not instead of it.
      <span className={point.grossProfit < 0 ? 'font-medium text-destructive' : 'font-medium text-foreground'}>
        {formatCurrencyVND(point.grossProfit)}
      </span>
    ),
  },
  {
    id: 'margin',
    header: 'Biên LN',
    align: 'right',
    // Reuses the same `safeRatio`/`formatPercent` foundation as the KPI
    // cards (requirement §29) — never a per-row reimplementation of the
    // 0-revenue-safe percentage logic, and never an average of these
    // per-row percentages treated as the period total (requirement §31;
    // the true total margin is computed once, from the KPI totals, in
    // `profit-report-page.tsx`).
    cell: (point) => formatPercent(safeRatio(point.grossProfit, point.revenue)),
  },
]

/**
 * Compact daily breakdown (Phase 7.3) — same shared `data` as `ProfitChart`
 * (no redundant query "for the table"), re-sorted newest-first for quick
 * operational reading (the chart stays chronological left-to-right). Doubles
 * as the accessible, non-visual way to read the same data the chart shows
 * (requirement §62).
 */
export function ProfitDailyTable({ data }: { data: ProfitDailyPoint[] }) {
  const rowsNewestFirst = [...data].reverse()

  return <DataTable columns={columns} data={rowsNewestFirst} getRowId={(point) => point.reportDate} />
}
