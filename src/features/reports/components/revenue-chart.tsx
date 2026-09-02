import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'

import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import type { RevenueDailyPoint } from '@/features/reports/types/revenue'

/** Matches `--primary` in `index.css` — recharts takes a literal SVG color, not a Tailwind class/CSS var. */
const CHART_COLOR = '#0d2b4e'

/** `'2026-08-05'` → `'05/08'` — short tick label; the tooltip shows the full `dd/MM/yyyy` date. */
function formatShortDate(ymd: string): string {
  const [, month, day] = ymd.split('-')
  return `${day}/${month}`
}

function RevenueTooltipContent({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload as RevenueDailyPoint

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{formatDate(point.reportDate)}</p>
      <p className="text-muted-foreground">
        Doanh thu: <span className="font-medium text-foreground">{formatCurrencyVND(point.revenue)}</span>
      </p>
      <p className="text-muted-foreground">
        Số đơn: <span className="font-medium text-foreground">{formatNumber(point.orderCount)}</span>
      </p>
    </div>
  )
}

/**
 * Revenue-over-time chart (Phase 7.2) — dumb/presentational: assumes
 * `data` is already the real, zero-filled, Vietnam-local-day-grouped
 * series from `get_revenue_timeseries()` (loading/error/empty states are
 * handled once by the parent page, shared with `RevenueDailyTable`, since
 * both render the same query result — see `revenue-report-page.tsx`).
 *
 * A single `Area`, not a decorated multi-series chart (`dashboard-ui`
 * skill rule 4 / requirement §16's "do not use overly decorative
 * charts"). Chronological left-to-right, unlike the daily table below it
 * which is sorted newest-first for quick operational reading
 * (requirement §19).
 */
export function RevenueChart({ data }: { data: RevenueDailyPoint[] }) {
  return (
    <div role="img" aria-label="Biểu đồ doanh thu theo ngày trong khoảng thời gian đã chọn" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.25} />
              <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
          <Tooltip content={RevenueTooltipContent} />
          <Area type="monotone" dataKey="revenue" stroke={CHART_COLOR} strokeWidth={2} fill="url(#revenue-fill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
