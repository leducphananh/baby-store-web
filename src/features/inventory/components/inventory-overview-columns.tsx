import { Link } from 'react-router'
import { Eye, Layers, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DataTableColumn } from '@/components/common/data-table'
import { ROUTES } from '@/routes/route-paths'
import { formatDate } from '@/utils/date'
import { formatQuantityWithUnit } from '@/utils/unit'
import { BatchExpiryBadge } from '@/features/batches/components/batch-expiry-badge'
import { StockStatusBadge } from '@/features/inventory/components/stock-status-badge'
import type { InventoryOverviewRow } from '@/features/inventory/types/inventory-overview'

/** `/products/:id#batches` — the product detail page scrolls to its batch table for this hash (see `product-detail-page.tsx`). */
function batchesHref(productId: string): string {
  return `${ROUTES.productDetail(productId)}#batches`
}

/**
 * Column definitions live in the feature, not the shared `DataTable` (see
 * `table-data-grid` rule 5). Expiry badging reuses `BatchExpiryBadge`
 * unchanged: the view's `nearest_expiration` is classified by the exact same
 * `classifyExpiry` threshold the view's own `expiry_status` was computed
 * with, so the two can never disagree (see `get-inventory-overview.ts`).
 */
export const inventoryOverviewColumns: DataTableColumn<InventoryOverviewRow>[] = [
  {
    id: 'name',
    header: 'Sản phẩm',
    sortable: true,
    cell: (row) => (
      <div className="flex flex-col">
        <Link
          to={ROUTES.productDetail(row.productId)}
          className="font-medium text-foreground hover:underline"
        >
          {row.name}
        </Link>
        <span className="font-mono text-xs text-muted-foreground">{row.sku}</span>
      </div>
    ),
  },
  {
    id: 'category',
    header: 'Danh mục',
    cell: (row) => <span className="text-muted-foreground">{row.categoryName ?? '—'}</span>,
  },
  {
    id: 'stock_quantity',
    header: 'Tồn kho',
    sortable: true,
    align: 'right',
    cell: (row) => (
      <div className="flex flex-col items-end gap-1">
        <span className="whitespace-nowrap">{formatQuantityWithUnit(row.stockQuantity, row.unit)}</span>
        <StockStatusBadge status={row.stockStatus} />
      </div>
    ),
  },
  {
    id: 'minimum_stock',
    header: 'Định mức tối thiểu',
    align: 'right',
    cell: (row) => (
      <span className="text-muted-foreground">
        {formatQuantityWithUnit(row.minimumStock, row.unit)}
      </span>
    ),
  },
  {
    id: 'batch_count',
    header: 'Số lô',
    align: 'right',
    cell: (row) => (row.batchCount > 0 ? row.batchCount : '—'),
  },
  {
    id: 'nearest_expiration',
    header: 'Hạn dùng gần nhất',
    sortable: true,
    cell: (row) =>
      row.nearestExpiration ? (
        <div className="flex flex-col items-start gap-1">
          <span>{formatDate(row.nearestExpiration)}</span>
          <BatchExpiryBadge expirationDate={row.nearestExpiration} />
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: 'actions',
    header: 'Thao tác',
    align: 'right',
    cell: (row) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Thao tác với sản phẩm ${row.name}`}
            data-tour="inventory-row-actions"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={ROUTES.productDetail(row.productId)}>
              <Eye />
              Xem sản phẩm
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={batchesHref(row.productId)}>
              <Layers />
              Xem lô hàng
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
