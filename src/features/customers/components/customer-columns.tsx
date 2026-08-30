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
import { TruncatedCell } from '@/components/common/truncated-cell'
import type { Customer } from '@/features/customers/types/customer'

/** Same shape as `supplier-columns.tsx` — see `table-data-grid`. */
export function getCustomerColumns({
  onView,
  onEdit,
  onDelete,
}: {
  onView: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}): DataTableColumn<Customer>[] {
  return [
    {
      id: 'name',
      header: 'Tên khách hàng',
      sortable: true,
      cell: (customer) => (
        <button
          type="button"
          onClick={() => onView(customer)}
          className="text-left font-medium text-foreground hover:underline"
        >
          {customer.name}
        </button>
      ),
    },
    {
      id: 'phone',
      header: 'Điện thoại',
      cell: (customer) => <span className="text-muted-foreground">{customer.phone || '—'}</span>,
    },
    {
      id: 'address',
      header: 'Địa chỉ',
      cell: (customer) => <TruncatedCell value={customer.address} maxWidth="max-w-56" />,
    },
    {
      id: 'notes',
      header: 'Ghi chú',
      cell: (customer) => <TruncatedCell value={customer.notes} maxWidth="max-w-56" />,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (customer) => (
        <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
          {customer.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      align: 'right',
      cell: (customer) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Thao tác với khách hàng ${customer.name}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(customer)}>
              <Eye />
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(customer)}>
              <Pencil />
              Sửa
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(customer)}>
              <Trash2 />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
