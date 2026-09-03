import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import { formatPercent, safeRatio } from '@/features/reports/utils/format-percent'
import type { CategoryPerformanceRow } from '@/features/reports/types/product-performance'

const columns: DataTableColumn<CategoryPerformanceRow>[] = [
  {
    id: 'category',
    header: 'Danh mục',
    cell: (row) => (
      <span className="font-medium text-foreground">{row.categoryName ?? 'Chưa phân loại'}</span>
    ),
  },
  {
    id: 'product_count_sold',
    header: 'Sản phẩm bán',
    align: 'right',
    cell: (row) => formatNumber(row.productCountSold),
  },
  { id: 'sold_quantity', header: 'Số lượng bán', align: 'right', cell: (row) => formatNumber(row.soldQuantity) },
  {
    id: 'revenue',
    header: 'Doanh thu',
    align: 'right',
    cell: (row) => <span className="font-medium text-foreground">{formatCurrencyVND(row.revenue)}</span>,
  },
  { id: 'cogs', header: 'Giá vốn', align: 'right', cell: (row) => formatCurrencyVND(row.cogs) },
  {
    id: 'gross_profit',
    header: 'Lợi nhuận',
    align: 'right',
    cell: (row) => (
      <span className={row.grossProfit < 0 ? 'font-medium text-destructive' : 'font-medium text-foreground'}>
        {formatCurrencyVND(row.grossProfit)}
      </span>
    ),
  },
  {
    id: 'gross_margin',
    header: 'Biên LN',
    align: 'right',
    cell: (row) => formatPercent(safeRatio(row.grossProfit, row.revenue)),
  },
]

/**
 * Category Performance summary (Phase 7.4, requirement §37/§40) — a plain
 * table, not a pie chart: pies get unreadable once there are more than a
 * handful of categories, a sortable/comparable table doesn't (requirement
 * §40). Already sorted revenue-descending by `get_category_performance()`
 * itself, so no client-side sort/pagination is needed for this small,
 * whole (never paginated — there are only ever as many rows as categories
 * plus one "Chưa phân loại") result set.
 */
export function CategoryPerformanceTable({ data }: { data: CategoryPerformanceRow[] }) {
  return (
    <DataTable columns={columns} data={data} getRowId={(row) => row.categoryId ?? 'uncategorized'} />
  )
}
