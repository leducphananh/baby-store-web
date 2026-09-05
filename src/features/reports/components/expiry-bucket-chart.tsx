import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'

import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import { EXPIRY_BUCKET_LABEL } from '@/features/reports/utils/expiry-bucket-labels'
import type { ExpiryBucketRow } from '@/features/reports/types/expiry'

/** `--destructive` for the one bucket that's already expired, `--warning` for anything still counting down, `--muted-foreground` for "no expiry data" — an objective distinction (expired vs. not), never a graded risk-color scale across the countdown buckets themselves (requirement §75: no arbitrary risk-quality coloring). */
const BUCKET_COLOR: Record<ExpiryBucketRow['bucket'], string> = {
  expired: '#ef4444',
  due_0_7: '#f59e0b',
  due_8_30: '#f59e0b',
  due_31_60: '#f59e0b',
  due_61_90: '#f59e0b',
  due_over_90: '#0d2b4e',
  missing_expiry: '#6b7280',
}

function ExpiryBucketTooltipContent({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload as ExpiryBucketRow

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{EXPIRY_BUCKET_LABEL[row.bucket]}</p>
      <p className="text-muted-foreground">
        Số lô: <span className="font-medium text-foreground">{formatNumber(row.batchCount)}</span>
      </p>
      <p className="text-muted-foreground">
        Số lượng tồn: <span className="font-medium text-foreground">{formatNumber(row.quantity)}</span>
      </p>
      <p className="text-muted-foreground">
        Giá trị tồn kho: <span className="font-medium text-foreground">{formatCurrencyVND(row.inventoryValue)}</span>
      </p>
    </div>
  )
}

/**
 * "Giá trị tồn kho theo thời gian đến hạn sử dụng" (Phase 7.6) — the FULL
 * 7-bucket distribution of every current remaining batch, always summing
 * to Phase 7.5's total inventory value (requirement §42/§97) — unlike the
 * horizon-scoped KPIs/table below it on the page. A plain bar chart with
 * only two color families (expired vs. not, requirement §75) — never a
 * pie, never a graded risk-color ramp across the countdown buckets.
 */
export function ExpiryBucketChart({ data }: { data: ExpiryBucketRow[] }) {
  const chartData = data.map((row) => ({ ...row, label: EXPIRY_BUCKET_LABEL[row.bucket] }))

  return (
    <div
      role="img"
      aria-label="Biểu đồ giá trị tồn kho theo thời gian đến hạn sử dụng, toàn bộ hàng tồn hiện tại"
      className="h-72 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis
            dataKey="label"
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
          <Tooltip content={ExpiryBucketTooltipContent} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
          <Bar dataKey="inventoryValue" name="inventoryValue" radius={[4, 4, 0, 0]}>
            {chartData.map((row) => (
              <Cell key={row.bucket} fill={BUCKET_COLOR[row.bucket]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
