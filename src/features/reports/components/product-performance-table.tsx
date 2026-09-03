import { Link } from 'react-router'

import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableSorting,
} from '@/components/common/data-table'
import { ProductStatusBadge } from '@/features/products/components/product-status-badge'
import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import { ROUTES } from '@/routes/route-paths'
import { formatPercent, safeRatio } from '@/features/reports/utils/format-percent'
import type {
  ProductPerformanceRow,
  ProductPerformanceSortField,
} from '@/features/reports/types/product-performance'

const columns: DataTableColumn<ProductPerformanceRow>[] = [
  {
    id: 'product',
    header: 'Sản phẩm',
    cell: (row) => (
      <div className="min-w-0 max-w-64">
        <div className="flex items-center gap-1.5">
          {/* Drill-down to the existing Product Detail page (requirement
             §32) — no new analytics detail page is introduced this phase. */}
          <Link to={ROUTES.productDetail(row.productId)} className="truncate font-medium text-foreground hover:underline">
            {row.productName}
          </Link>
          {row.productStatus === 'archived' && <ProductStatusBadge status="archived" />}
        </div>
        <p className="truncate text-xs text-muted-foreground">{row.sku}</p>
      </div>
    ),
  },
  {
    id: 'category',
    header: 'Danh mục',
    cell: (row) => row.categoryName ?? 'Chưa phân loại',
  },
  { id: 'unit', header: 'Đơn vị', cell: (row) => row.unit },
  {
    id: 'sold_quantity',
    header: 'Số lượng bán',
    align: 'right',
    sortable: true,
    cell: (row) => formatNumber(row.soldQuantity),
  },
  {
    id: 'order_count',
    header: 'Số đơn',
    align: 'right',
    sortable: true,
    cell: (row) => formatNumber(row.orderCount),
  },
  {
    id: 'revenue',
    header: 'Doanh thu',
    align: 'right',
    sortable: true,
    cell: (row) => <span className="font-medium text-foreground">{formatCurrencyVND(row.revenue)}</span>,
  },
  {
    id: 'cogs',
    header: 'Giá vốn',
    align: 'right',
    sortable: true,
    cell: (row) => formatCurrencyVND(row.cogs),
  },
  {
    id: 'gross_profit',
    header: 'Lợi nhuận gộp',
    align: 'right',
    sortable: true,
    cell: (row) => (
      // Negative profit stays visible as the real signed value (requirement
      // §11) — `--destructive` is the same objective, threshold-free
      // negative/positive semantic used by the Profit Report's daily
      // table, never an arbitrary margin-quality color (requirement §75).
      <span className={row.grossProfit < 0 ? 'font-medium text-destructive' : 'font-medium text-foreground'}>
        {formatCurrencyVND(row.grossProfit)}
      </span>
    ),
  },
  {
    id: 'gross_margin',
    header: 'Biên lợi nhuận',
    align: 'right',
    sortable: true,
    // Reuses the shared Phase 7.1 safeRatio/formatPercent foundation — never
    // reimplemented per report (requirement §12).
    cell: (row) => formatPercent(safeRatio(row.grossProfit, row.revenue)),
  },
]

/**
 * Product Performance table (Phase 7.4) — server-driven search/category
 * filter/sort/pagination (the caller wires `sorting`/`onSortingChange` to
 * the RPC's `p_sort_by`/`p_sort_desc`, requirement §28/§29): every
 * `sortable` column id here is one of `ProductPerformanceSortField`
 * exactly, so a header click maps straight onto the query without a
 * separate "Xếp hạng theo" selector duplicating the same control
 * (requirement §27's ranking options, satisfied via column sorting).
 *
 * The table is the primary accessible representation of this report — the
 * chart (`TopProductsChart`) is supplementary only (requirement §79).
 */
export function ProductPerformanceTable({
  data,
  isLoading,
  sorting,
  onSortingChange,
  pagination,
  className,
}: {
  data: ProductPerformanceRow[]
  isLoading: boolean
  sorting: DataTableSorting
  onSortingChange: (sorting: { id: ProductPerformanceSortField; desc: boolean }) => void
  pagination: DataTablePagination
  className?: string
}) {
  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.productId}
      isLoading={isLoading}
      sorting={sorting}
      onSortingChange={(next) => onSortingChange({ id: next.id as ProductPerformanceSortField, desc: next.desc })}
      pagination={pagination}
      className={className}
    />
  )
}
