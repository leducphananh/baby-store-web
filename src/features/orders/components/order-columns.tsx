import { Link } from 'react-router'
import { Eye, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DataTableColumn } from '@/components/common/data-table'
import { ROUTES } from '@/routes/route-paths'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge'
import { PaymentStatusBadge } from '@/features/orders/components/payment-status-badge'
import type { Order } from '@/features/orders/types/order'

type Actions = {
  onView: (order: Order) => void
}

/**
 * Column definitions for the store-wide order list (Phase 6.1; see
 * `table-data-grid`). Order create/edit/complete/cancel isn't built yet, so
 * "Xem chi tiết" is the only action for now — kept in a dropdown (rather
 * than a bare icon button) so a later phase can add items without
 * restructuring the column, same convention as `getCustomerColumns`.
 */
export function getOrderColumns({ onView }: Actions): DataTableColumn<Order>[] {
  return [
    {
      id: 'order_number',
      header: 'Mã đơn hàng',
      sortable: true,
      cell: (order) => (
        <Link
          to={ROUTES.orderDetail(order.id)}
          className="font-mono text-sm font-medium text-foreground hover:underline"
        >
          {order.orderNumber}
        </Link>
      ),
    },
    {
      id: 'customer',
      header: 'Khách hàng',
      cell: (order) =>
        order.customerId ? (
          <Link to={ROUTES.customerDetail(order.customerId)} className="text-foreground hover:underline">
            {order.customerName ?? 'Khách hàng'}
          </Link>
        ) : (
          <span className="text-muted-foreground">Khách lẻ</span>
        ),
    },
    {
      id: 'order_date',
      header: 'Ngày tạo',
      sortable: true,
      cell: (order) => formatDate(order.orderDate),
    },
    {
      id: 'total',
      header: 'Tổng tiền',
      align: 'right',
      sortable: true,
      cell: (order) => formatCurrencyVND(order.total),
    },
    {
      id: 'payment_status',
      header: 'Thanh toán',
      cell: (order) => <PaymentStatusBadge status={order.paymentStatus} />,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      align: 'right',
      cell: (order) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Thao tác với đơn hàng ${order.orderNumber}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(order)}>
              <Eye />
              Xem chi tiết
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
