import { Link } from 'react-router'
import { Ban, Eye, MoreHorizontal, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DataTableColumn } from '@/components/common/data-table'
import { ROUTES } from '@/routes/route-paths'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatQuantityWithUnit } from '@/utils/unit'
import { ImportReceiptStatusBadge } from '@/features/import-receipts/components/import-receipt-status-badge'
import type { ImportReceipt } from '@/features/import-receipts/types/import-receipt'

type Actions = {
  onView: (receipt: ImportReceipt) => void
  onEdit: (receipt: ImportReceipt) => void
  onCancel: (receipt: ImportReceipt) => void
}

/**
 * Column definitions for the import-receipt list (see `table-data-grid`).
 * Money right-aligned; edit/cancel are offered only for `draft` receipts —
 * confirmed/cancelled are immutable historical documents (CLAUDE.md §11).
 */
export function getImportReceiptColumns({ onView, onEdit, onCancel }: Actions): DataTableColumn<ImportReceipt>[] {
  return [
    {
      id: 'receipt_number',
      header: 'Mã phiếu',
      sortable: true,
      cell: (receipt) => (
        <Link
          to={ROUTES.importDetail(receipt.id)}
          className="font-mono text-sm font-medium text-foreground hover:underline"
        >
          {receipt.receiptNumber}
        </Link>
      ),
    },
    {
      id: 'supplier',
      header: 'Nhà cung cấp',
      cell: (receipt) => (
        <span className={receipt.supplierName ? 'text-foreground' : 'text-muted-foreground'}>
          {receipt.supplierName ?? '—'}
        </span>
      ),
    },
    {
      id: 'import_date',
      header: 'Ngày nhập',
      sortable: true,
      cell: (receipt) => formatDate(receipt.importDate),
    },
    {
      id: 'items',
      header: 'Số dòng',
      align: 'right',
      cell: (receipt) => (
        <span className="text-muted-foreground">
          {formatQuantityWithUnit(receipt.itemCount, 'dòng')}
        </span>
      ),
    },
    {
      id: 'total',
      header: 'Tổng chi phí',
      align: 'right',
      cell: (receipt) => formatCurrencyVND(receipt.totalCost),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (receipt) => <ImportReceiptStatusBadge status={receipt.status} />,
    },
    {
      id: 'created_by',
      header: 'Người tạo',
      cell: (receipt) => (
        <span className="text-muted-foreground">{receipt.createdByName ?? '—'}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      align: 'right',
      cell: (receipt) => {
        const isDraft = receipt.status === 'draft'
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Thao tác với phiếu ${receipt.receiptNumber}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(receipt)}>
                <Eye />
                Xem chi tiết
              </DropdownMenuItem>
              {isDraft && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(receipt)}>
                    <Pencil />
                    Sửa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => onCancel(receipt)}>
                    <Ban />
                    Hủy phiếu
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
