import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'

import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import { formatPercent, safeRatio } from '@/features/reports/utils/format-percent'
import type { ProfitDailyPoint } from '@/features/reports/types/profit'

/** Matches `--primary`/`--warning`/`--success` in `index.css` — recharts
 * takes a literal SVG color, not a Tailwind class/CSS var. Distinct enough
 * hues (not just distinct lightness) so the three series stay tellable
 * apart without relying on color alone — the legend/tooltip always name
 * each series in text too (requirement §62). */
const REVENUE_COLOR = '#0d2b4e'
const COGS_COLOR = '#f59e0b'
const PROFIT_COLOR = '#16a34a'

const SERIES_LABEL: Record<'revenue' | 'cogs' | 'grossProfit', string> = {
  revenue: 'Doanh thu',
  cogs: 'Giá vốn',
  grossProfit: 'Lợi nhuận gộp',
}

/** `'2026-08-05'` → `'05/08'` — short tick label; the tooltip shows the full `dd/MM/yyyy` date. */
function formatShortDate(ymd: string): string {
  const [, month, day] = ymd.split('-')
  return `${day}/${month}`
}

function ProfitTooltipContent({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload as ProfitDailyPoint
  const margin = formatPercent(safeRatio(point.grossProfit, point.revenue))

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{formatDate(point.reportDate)}</p>
      <p className="text-muted-foreground">
        Doanh thu: <span className="font-medium text-foreground">{formatCurrencyVND(point.revenue)}</span>
      </p>
      <p className="text-muted-foreground">
        Giá vốn: <span className="font-medium text-foreground">{formatCurrencyVND(point.cogs)}</span>
      </p>
      <p className="text-muted-foreground">
        Lợi nhuận gộp: <span className="font-medium text-foreground">{formatCurrencyVND(point.grossProfit)}</span>
      </p>
      <p className="text-muted-foreground">
        Biên lợi nhuận: <span className="font-medium text-foreground">{margin}</span>
      </p>
      <p className="text-muted-foreground">
        Số đơn: <span className="font-medium text-foreground">{formatNumber(point.orderCount)}</span>
      </p>
    </div>
  )
}

/**
 * Revenue/COGS/Gross-Profit-over-time chart (Phase 7.3) — dumb/presentational,
 * same contract as `RevenueChart`: assumes `data` is already the real,
 * zero-filled, Vietnam-local-day-grouped series from `get_profit_timeseries()`
 * (loading/error/empty states are handled once by the parent page, shared
 * with `ProfitDailyTable` — see `profit-report-page.tsx`).
 *
 * A multi-line chart, not stacked bars (requirement §25): stacking would
 * visually imply `Revenue = COGS + Profit` and can't represent a negative
 * Gross Profit day without breaking that reading. A plain `LineChart` has
 * no such constraint — the Y axis auto-scales to include negative values
 * (never clamped to 0, requirement §26), and the "Lợi nhuận gộp" line can
 * simply dip below the zero line on a loss-making day.
 */
export function ProfitChart({ data }: { data: ProfitDailyPoint[] }) {
  return (
    <div
      role="img"
      aria-label="Biểu đồ doanh thu, giá vốn và lợi nhuận gộp theo ngày trong khoảng thời gian đã chọn"
      className="h-80 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis
            dataKey="reportDate"
            tickFormatter={formatShortDate}
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            axisLine={{ className: 'stroke-border' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value: number) => formatNumber(value)}
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip content={ProfitTooltipContent} />
          <Legend
            formatter={(value: string) => SERIES_LABEL[value as keyof typeof SERIES_LABEL]}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line type="monotone" dataKey="revenue" name="revenue" stroke={REVENUE_COLOR} strokeWidth={2} dot={false} />
          <Line
            type="monotone"
            dataKey="cogs"
            name="cogs"
            stroke={COGS_COLOR}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="grossProfit"
            name="grossProfit"
            stroke={PROFIT_COLOR}
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
