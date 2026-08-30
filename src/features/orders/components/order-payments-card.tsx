import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'
import { useOrderPayments } from '@/features/orders/hooks/use-order-payments'
import type { OrderDetail, OrderPayment, OrderPaymentMethod } from '@/features/orders/types/order-detail'

const PAYMENT_METHOD_LABEL: Record<OrderPaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  other: 'Khác',
}

const columns: DataTableColumn<OrderPayment>[] = [
  {
    id: 'paid_at',
    header: 'Ngày thanh toán',
    cell: (payment) => (payment.paidAt ? formatDateTime(payment.paidAt) : '—'),
  },
  {
    id: 'method',
    header: 'Phương thức',
    cell: (payment) => PAYMENT_METHOD_LABEL[payment.paymentMethod],
  },
  {
    id: 'amount',
    header: 'Số tiền',
    align: 'right',
    cell: (payment) => <span className="font-medium text-foreground">{formatCurrencyVND(payment.amount)}</span>,
  },
  {
    id: 'note',
    header: 'Ghi chú',
    cell: (payment) => <span className="text-muted-foreground">{payment.note || '—'}</span>,
  },
]

/** Same small stat-tile shape as `CustomerOrderSummaryCards`'s local `Stat`. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

/**
 * Order totals (`orders.subtotal`/`discount`/`total` — read straight from
 * the row, never recomputed here) plus the payments actually recorded
 * against it. Recording a payment is a later phase; this only reads
 * `order_payments`, so an empty list is the normal state for every order
 * today, not an error.
 */
export function OrderPaymentsCard({ order }: { order: OrderDetail }) {
  const paymentsQuery = useOrderPayments(order.id)
  const payments = paymentsQuery.data ?? []
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remaining = order.total - totalPaid

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tổng cộng &amp; thanh toán</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Tạm tính" value={formatCurrencyVND(order.subtotal)} />
          <Stat label="Giảm giá" value={formatCurrencyVND(order.discount)} />
          <Stat label="Tổng cộng" value={formatCurrencyVND(order.total)} />
          <Stat label="Đã thanh toán" value={formatCurrencyVND(totalPaid)} />
          <Stat label="Còn lại" value={formatCurrencyVND(Math.max(remaining, 0))} />
        </div>

        {paymentsQuery.isError ? (
          <ErrorState message="Không thể tải lịch sử thanh toán." onRetry={() => void paymentsQuery.refetch()} />
        ) : paymentsQuery.isLoading ? (
          <DataTable columns={columns} data={[]} getRowId={(payment) => payment.id} isLoading />
        ) : payments.length === 0 ? (
          <EmptyState
            title="Chưa có thanh toán nào"
            description="Chưa có khoản thanh toán nào được ghi nhận cho đơn hàng này."
          />
        ) : (
          <DataTable columns={columns} data={payments} getRowId={(payment) => payment.id} />
        )}
      </CardContent>
    </Card>
  )
}
