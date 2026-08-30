import { useState } from 'react'
import { Link } from 'react-router'
import { ShoppingCart } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatQuantityWithUnit } from '@/utils/unit'
import { ROUTES } from '@/routes/route-paths'
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge'
import { PaymentStatusBadge } from '@/features/orders/components/payment-status-badge'
import { useCustomerOrders } from '@/features/orders/hooks/use-customer-orders'
import type { CustomerOrder } from '@/features/orders/types/order'
import { usePersistedPageSize } from '@/hooks/use-persisted-page-size'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_STORAGE_KEY = 'baby-wale.customer-orders.page-size'

const columns: DataTableColumn<CustomerOrder>[] = [
  {
    id: 'order_number',
    header: 'Mã đơn hàng',
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
    id: 'order_date',
    header: 'Ngày đặt',
    cell: (order) => formatDate(order.orderDate),
  },
  {
    id: 'items',
    header: 'Số dòng',
    align: 'right',
    cell: (order) => (
      <span className="text-muted-foreground">{formatQuantityWithUnit(order.itemCount, 'dòng')}</span>
    ),
  },
  {
    id: 'status',
    header: 'Trạng thái',
    cell: (order) => <OrderStatusBadge status={order.status} />,
  },
  {
    id: 'payment_status',
    header: 'Thanh toán',
    cell: (order) => <PaymentStatusBadge status={order.paymentStatus} />,
  },
  {
    id: 'total',
    header: 'Tổng tiền',
    align: 'right',
    cell: (order) => formatCurrencyVND(order.total),
  },
]

/**
 * A customer's purchase history — paginated, newest-first, so the first
 * page doubles as "recent purchases" without a separate redundant list (see
 * `getCustomerOrders`). Row click on the order code navigates to Order
 * Detail; that page isn't built yet (a later phase), so it currently lands
 * on the shared `ComingSoonPage` placeholder like every other unbuilt
 * route — never a dead/unrouted link.
 */
export function CustomerOrdersCard({ customerId }: { customerId: string }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = usePersistedPageSize(
    PAGE_SIZE_STORAGE_KEY,
    PAGE_SIZE_OPTIONS,
    DEFAULT_PAGE_SIZE,
  )

  const ordersQuery = useCustomerOrders({ customerId, page, pageSize })
  const orders = ordersQuery.data?.data ?? []
  const total = ordersQuery.data?.total ?? 0

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize)
    setPage(1)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử đơn hàng</CardTitle>
      </CardHeader>
      <CardContent>
        {ordersQuery.isError ? (
          <ErrorState
            message="Không thể tải lịch sử đơn hàng."
            onRetry={() => void ordersQuery.refetch()}
          />
        ) : ordersQuery.isLoading ? (
          <DataTable columns={columns} data={[]} getRowId={(order) => order.id} isLoading />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Chưa có đơn hàng nào"
            description="Khách hàng này chưa có đơn hàng nào được ghi nhận."
          />
        ) : (
          <DataTable
            columns={columns}
            data={orders}
            getRowId={(order) => order.id}
            pagination={{
              pageIndex: page,
              pageSize,
              total,
              onPageChange: setPage,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              onPageSizeChange: handlePageSizeChange,
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}
