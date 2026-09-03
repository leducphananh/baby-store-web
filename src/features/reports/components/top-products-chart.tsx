import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'

import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import { formatPercent, safeRatio } from '@/features/reports/utils/format-percent'
import type { ProductPerformanceRow } from '@/features/reports/types/product-performance'

/** Matches `--primary` in `index.css` — recharts takes a literal SVG color, not a Tailwind class/CSS var. */
const BAR_COLOR = '#0d2b4e'
const MAX_LABEL_LENGTH = 18

function truncateName(name: string): string {
  return name.length > MAX_LABEL_LENGTH ? `${name.slice(0, MAX_LABEL_LENGTH - 1)}…` : name
}

function TopProductsTooltipContent({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload as ProductPerformanceRow
  const margin = formatPercent(safeRatio(row.grossProfit, row.revenue))

  return (
    <div className="max-w-64 rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{row.productName}</p>
      <p className="text-muted-foreground">
        Số lượng bán: <span className="font-medium text-foreground">{formatNumber(row.soldQuantity)}</span>
      </p>
      <p className="text-muted-foreground">
        Doanh thu: <span className="font-medium text-foreground">{formatCurrencyVND(row.revenue)}</span>
      </p>
      <p className="text-muted-foreground">
        Giá vốn: <span className="font-medium text-foreground">{formatCurrencyVND(row.cogs)}</span>
      </p>
      <p className="text-muted-foreground">
        Lợi nhuận gộp: <span className="font-medium text-foreground">{formatCurrencyVND(row.grossProfit)}</span>
      </p>
      <p className="text-muted-foreground">
        Biên lợi nhuận: <span className="font-medium text-foreground">{margin}</span>
      </p>
    </div>
  )
}

/**
 * "Top 10 theo doanh thu" horizontal bar chart (Phase 7.4) — fixed to
 * revenue rather than following the table's own ranking selector
 * (requirement §76's documented simpler option): the table already lets a
 * user sort by any metric with full row detail, so the chart's job is a
 * single, always-consistent "who matters most by revenue" glance, not a
 * second synced ranking control. Dumb/presentational — `data` is assumed
 * already limited to the top 10 by revenue, descending (see
 * `product-performance-report-page.tsx`, requirement §36).
 */
export function TopProductsChart({ data }: { data: ProductPerformanceRow[] }) {
  return (
    <div
      role="img"
      aria-label="Biểu đồ 10 sản phẩm có doanh thu cao nhất trong khoảng thời gian đã chọn"
      className="h-80 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
          <XAxis
            type="number"
            tickFormatter={(value: number) => formatNumber(value)}
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="productName"
            tickFormatter={truncateName}
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={130}
          />
          <Tooltip content={TopProductsTooltipContent} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
          <Bar dataKey="revenue" name="revenue" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
