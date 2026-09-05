import { Link } from 'react-router'

import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableSorting,
} from '@/components/common/data-table'
import { StockStatusBadge } from '@/features/inventory/components/stock-status-badge'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatQuantityWithUnit } from '@/utils/unit'
import { ROUTES } from '@/routes/route-paths'
import type { InventoryReportRow, InventoryReportSortField } from '@/features/reports/types/inventory'

const columns: DataTableColumn<InventoryReportRow>[] = [
  {
    id: 'name',
    header: 'Sản phẩm',
    sortable: true,
    cell: (row) => (
      <div className="min-w-0 max-w-64">
        <Link to={ROUTES.productDetail(row.productId)} className="truncate font-medium text-foreground hover:underline">
          {row.productName}
        </Link>
        <p className="truncate text-xs text-muted-foreground">{row.sku}</p>
      </div>
    ),
  },
  { id: 'category', header: 'Danh mục', cell: (row) => row.categoryName ?? 'Chưa phân loại' },
  { id: 'unit', header: 'Đơn vị', cell: (row) => row.unit },
  {
    id: 'current_quantity',
    header: 'Tồn kho',
    align: 'right',
    sortable: true,
    cell: (row) => formatQuantityWithUnit(row.currentQuantity, row.unit),
  },
  {
    id: 'batch_count',
    header: 'Số lô',
    align: 'right',
    sortable: true,
    cell: (row) => (row.batchCount > 0 ? row.batchCount : '—'),
  },
  {
    id: 'inventory_value',
    header: 'Giá trị tồn',
    align: 'right',
    sortable: true,
    cell: (row) => <span className="font-medium text-foreground">{formatCurrencyVND(row.inventoryValue)}</span>,
  },
  {
    id: 'average_cost',
    header: 'Giá vốn TB',
    align: 'right',
    sortable: true,
    // No stock → no meaningful average cost: "—", not "0 ₫" (same reasoning
    // as Revenue Report's "day with 0 orders" average).
    cell: (row) => (row.averageCost !== null ? formatCurrencyVND(row.averageCost) : '—'),
  },
  {
    id: 'minimum_stock',
    header: 'Mức tồn tối thiểu',
    align: 'right',
    // "5 / tối thiểu 10" only when a threshold is actually configured
    // (requirement §53) — a product with no minimum_stock set (0, the
    // column default) has nothing meaningful to compare against.
    cell: (row) =>
      row.minimumStock > 0 ? (
        <span className="text-muted-foreground">
          {formatQuantityWithUnit(row.currentQuantity, row.unit)} / tối thiểu {formatQuantityWithUnit(row.minimumStock, row.unit)}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: 'stock_status',
    header: 'Trạng thái',
    cell: (row) => <StockStatusBadge status={row.stockStatus} />,
  },
  {
    id: 'nearest_expiration',
    header: 'Hạn gần nhất',
    cell: (row) => (row.nearestExpiration ? formatDate(row.nearestExpiration) : <span className="text-muted-foreground">—</span>),
  },
]

/**
 * Inventory Report product table (Phase 7.5) — server-driven search/
 * category/stock-status filter/sort/pagination. Every `sortable` column id
 * here is one of `InventoryReportSortField` exactly, doubling as the
 * ranking control (same convention as Product Performance's table,
 * requirement §29). `StockStatusBadge`/"Chưa phân loại" reuse the Phase 4.6
 * Inventory Dashboard's exact same badge/label — one stock-status
 * vocabulary (requirement §52/§72). "Hạn gần nhất" is lightweight context
 * only (already computed by `product_inventory_overview`) — no expiry
 * badge/risk classification here, that belongs to Phase 7.6 (requirement
 * §38/§87).
 */
export function InventoryReportTable({
  data,
  isLoading,
  sorting,
  onSortingChange,
  pagination,
}: {
  data: InventoryReportRow[]
  isLoading: boolean
  sorting: DataTableSorting
  onSortingChange: (sorting: { id: InventoryReportSortField; desc: boolean }) => void
  pagination: DataTablePagination
}) {
  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.productId}
      isLoading={isLoading}
      sorting={sorting}
      onSortingChange={(next) => onSortingChange({ id: next.id as InventoryReportSortField, desc: next.desc })}
      pagination={pagination}
    />
  )
}
