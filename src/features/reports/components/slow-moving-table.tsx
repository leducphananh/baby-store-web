import { Link } from 'react-router'

import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableSorting,
} from '@/components/common/data-table'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import { ROUTES } from '@/routes/route-paths'
import type { SalesLookbackDays, SlowMovingRow, SlowMovingSortField } from '@/features/reports/types/expiry'

/**
 * Columns are built per `lookbackDays` so headers read "SL bán trong 30
 * ngày" rather than a bare, context-free "SL bán" (requirement §23/§35 —
 * always naming this as the selected analysis window, never implying a
 * fixed rule).
 */
function buildColumns(lookbackDays: SalesLookbackDays): DataTableColumn<SlowMovingRow>[] {
  return [
    {
      id: 'name',
      header: 'Sản phẩm',
      sortable: true,
      cell: (row) => (
        <div className="min-w-0 max-w-56">
          <Link to={ROUTES.productDetail(row.productId)} className="truncate font-medium text-foreground hover:underline">
            {row.productName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{row.sku}</p>
        </div>
      ),
    },
    { id: 'category', header: 'Danh mục', cell: (row) => row.categoryName ?? 'Chưa phân loại' },
    {
      id: 'current_quantity',
      header: 'Tồn kho',
      align: 'right',
      sortable: true,
      cell: (row) => formatNumber(row.currentQuantity),
    },
    {
      id: 'inventory_value',
      header: 'Giá trị tồn',
      align: 'right',
      sortable: true,
      cell: (row) => <span className="font-medium text-foreground">{formatCurrencyVND(row.inventoryValue)}</span>,
    },
    {
      id: 'last_sold_at',
      header: 'Lần bán gần nhất',
      sortable: true,
      // "Chưa từng bán" — an objective, operationally important fact, never
      // a fabricated distant date (requirement §25).
      cell: (row) =>
        row.lastSoldAt ? formatDate(row.lastSoldAt) : <span className="text-muted-foreground">Chưa từng bán</span>,
    },
    {
      id: 'days_since_last_sale',
      header: 'Số ngày chưa bán',
      align: 'right',
      sortable: true,
      cell: (row) => (row.daysSinceLastSale !== null ? formatNumber(row.daysSinceLastSale) : '—'),
    },
    {
      id: 'sold_quantity',
      header: `SL bán trong ${lookbackDays} ngày`,
      align: 'right',
      sortable: true,
      cell: (row) => formatNumber(row.soldQuantityLookback),
    },
    {
      id: 'order_count',
      header: `Số đơn trong ${lookbackDays} ngày`,
      align: 'right',
      sortable: true,
      cell: (row) => formatNumber(row.orderCountLookback),
    },
    {
      id: 'revenue',
      header: `Doanh thu trong ${lookbackDays} ngày`,
      align: 'right',
      sortable: true,
      cell: (row) => formatCurrencyVND(row.revenueLookback),
    },
  ]
}

/**
 * Factual current-inventory + recent-sales table (Phase 7.6, requirement
 * §33) — no "Chậm bán" status column: this app has no configured slow-
 * moving business rule, so the table shows dimensions (recency, lookback
 * volume, inventory value) and lets sorting/filtering surface what the
 * operator considers worth checking (requirement §22/§74). Every
 * `sortable` column id is one of `SlowMovingSortField` exactly.
 */
export function SlowMovingTable({
  data,
  isLoading,
  lookbackDays,
  sorting,
  onSortingChange,
  pagination,
}: {
  data: SlowMovingRow[]
  isLoading: boolean
  lookbackDays: SalesLookbackDays
  sorting: DataTableSorting
  onSortingChange: (sorting: { id: SlowMovingSortField; desc: boolean }) => void
  pagination: DataTablePagination
}) {
  const columns = buildColumns(lookbackDays)

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.productId}
      isLoading={isLoading}
      sorting={sorting}
      onSortingChange={(next) => onSortingChange({ id: next.id as SlowMovingSortField, desc: next.desc })}
      pagination={pagination}
    />
  )
}
