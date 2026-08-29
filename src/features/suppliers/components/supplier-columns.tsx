import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DataTableColumn } from '@/components/common/data-table'
import type { Supplier } from '@/features/suppliers/types/supplier'

/**
 * Address/notes can be long — truncate to two lines in the table and rely on
 * the native `title` attribute for a full-text hover tooltip (no tooltip
 * primitive exists in the project yet, so this stays dependency-free); the
 * underlying value is never altered, and the full text is always reachable
 * via "Xem chi tiết" (`SupplierDetailSheet`), which already shows every
 * field in full.
 */
function TruncatedCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return (
    <span className="line-clamp-2 max-w-56 text-muted-foreground" title={value}>
      {value}
    </span>
  )
}

/** Same shape as `category-columns.tsx` — see `table-data-grid`. */
export function getSupplierColumns({
  onView,
  onEdit,
  onDelete,
}: {
  onView: (supplier: Supplier) => void
  onEdit: (supplier: Supplier) => void
  onDelete: (supplier: Supplier) => void
}): DataTableColumn<Supplier>[] {
  return [
    {
      id: 'name',
      header: 'Tên nhà cung cấp',
      sortable: true,
      cell: (supplier) => (
        <button
          type="button"
          onClick={() => onView(supplier)}
          className="text-left font-medium text-foreground hover:underline"
        >
          {supplier.name}
        </button>
      ),
    },
    {
      id: 'contact_person',
      header: 'Người liên hệ',
      cell: (supplier) => <span className="text-muted-foreground">{supplier.contactPerson || '—'}</span>,
    },
    {
      id: 'phone',
      header: 'Điện thoại',
      cell: (supplier) => <span className="text-muted-foreground">{supplier.phone || '—'}</span>,
    },
    {
      id: 'address',
      header: 'Địa chỉ',
      cell: (supplier) => <TruncatedCell value={supplier.address} />,
    },
    {
      id: 'notes',
      header: 'Ghi chú',
      cell: (supplier) => <TruncatedCell value={supplier.notes} />,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (supplier) => (
        <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
          {supplier.status === 'active' ? 'Đang hợp tác' : 'Ngừng hợp tác'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      align: 'right',
      cell: (supplier) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Thao tác với nhà cung cấp ${supplier.name}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(supplier)}>
              <Eye />
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(supplier)}>
              <Pencil />
              Sửa
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(supplier)}>
              <Trash2 />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
