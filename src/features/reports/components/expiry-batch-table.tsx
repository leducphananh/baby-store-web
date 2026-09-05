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
import { ExpiryStatusBadge } from '@/features/reports/components/expiry-status-badge'
import type { ExpiryBatchRow, ExpiryBatchSortField } from '@/features/reports/types/expiry'

const columns: DataTableColumn<ExpiryBatchRow>[] = [
  {
    id: 'product_name',
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
  { id: 'lot_number', header: 'Mã lô', cell: (row) => row.lotNumber ?? '—' },
  { id: 'category', header: 'Danh mục', cell: (row) => row.categoryName ?? 'Chưa phân loại' },
  {
    id: 'remaining_quantity',
    header: 'Tồn lô',
    align: 'right',
    sortable: true,
    cell: (row) => formatNumber(row.remainingQuantity),
  },
  { id: 'purchase_price', header: 'Giá nhập', align: 'right', cell: (row) => formatCurrencyVND(row.purchasePrice) },
  {
    id: 'inventory_value',
    header: 'Giá trị tồn',
    align: 'right',
    sortable: true,
    cell: (row) => <span className="font-medium text-foreground">{formatCurrencyVND(row.inventoryValue)}</span>,
  },
  {
    id: 'expiration_date',
    header: 'Hạn sử dụng',
    align: 'right',
    sortable: true,
    cell: (row) => (row.expirationDate ? formatDate(row.expirationDate) : <span className="text-muted-foreground">—</span>),
  },
  {
    id: 'expiry_status',
    header: 'Trạng thái HSD',
    cell: (row) => <ExpiryStatusBadge status={row.expiryStatus} daysRemaining={row.daysRemaining} />,
  },
]

/**
 * Batch-level expiry-risk table (Phase 7.6, requirement §36) — the
 * accessible, primary representation of expiry risk (the chart is
 * supplementary, requirement §81). Every `sortable` column id is one of
 * `ExpiryBatchSortField` exactly (requirement §40: default is
 * `expiration_date` ascending, expired first, missing-expiry
 * deterministically last).
 */
export function ExpiryBatchTable({
  data,
  isLoading,
  sorting,
  onSortingChange,
  pagination,
}: {
  data: ExpiryBatchRow[]
  isLoading: boolean
  sorting: DataTableSorting
  onSortingChange: (sorting: { id: ExpiryBatchSortField; desc: boolean }) => void
  pagination: DataTablePagination
}) {
  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.batchId}
      isLoading={isLoading}
      sorting={sorting}
      onSortingChange={(next) => onSortingChange({ id: next.id as ExpiryBatchSortField, desc: next.desc })}
      pagination={pagination}
    />
  )
}
