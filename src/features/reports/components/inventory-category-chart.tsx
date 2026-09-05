import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'

import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import type { InventoryCategoryRow } from '@/features/reports/types/inventory'

/** Matches `--primary` in `index.css` — recharts takes a literal SVG color, not a Tailwind class/CSS var. */
const BAR_COLOR = '#0d2b4e'
const MAX_LABEL_LENGTH = 18
const UNCATEGORIZED_LABEL = 'Chưa phân loại'

function truncateName(name: string): string {
  return name.length > MAX_LABEL_LENGTH ? `${name.slice(0, MAX_LABEL_LENGTH - 1)}…` : name
}

function categoryLabel(row: InventoryCategoryRow): string {
  return row.categoryName ?? UNCATEGORIZED_LABEL
}

function InventoryCategoryTooltipContent({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload as InventoryCategoryRow

  return (
    <div className="max-w-64 rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{categoryLabel(row)}</p>
      <p className="text-muted-foreground">
        Số sản phẩm: <span className="font-medium text-foreground">{formatNumber(row.productCount)}</span>
      </p>
      <p className="text-muted-foreground">
        Số lượng tồn: <span className="font-medium text-foreground">{formatNumber(row.totalQuantity)}</span>
      </p>
      <p className="text-muted-foreground">
        Giá trị tồn kho: <span className="font-medium text-foreground">{formatCurrencyVND(row.inventoryValue)}</span>
      </p>
    </div>
  )
}

/**
 * "Giá trị tồn kho theo danh mục" horizontal bar chart (Phase 7.5,
 * requirement §31/§54) — top 10 categories by inventory value, from the
 * already-fetched, already-sorted-descending `get_inventory_category_summary()`
 * result (no extra query). A plain bar chart, not a pie (requirement §31:
 * avoid pie charts once there are more than a handful of categories).
 */
export function InventoryCategoryChart({ data }: { data: InventoryCategoryRow[] }) {
  const top10 = data.filter((row) => row.inventoryValue > 0).slice(0, 10)
  const chartData = top10.map((row) => ({ ...row, label: categoryLabel(row) }))

  return (
    <div
      role="img"
      aria-label="Biểu đồ giá trị tồn kho theo danh mục"
      className="h-72 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
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
            dataKey="label"
            tickFormatter={truncateName}
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={130}
          />
          <Tooltip content={InventoryCategoryTooltipContent} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
          <Bar dataKey="inventoryValue" name="inventoryValue" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
