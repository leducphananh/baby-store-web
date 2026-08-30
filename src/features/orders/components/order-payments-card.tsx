import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'
import { RecordPaymentDialog } from '@/features/orders/components/record-payment-dialog'
import { useOrderPayments } from '@/features/orders/hooks/use-order-payments'
import { PAYMENT_METHOD_LABEL } from '@/features/orders/utils/payment-method-label'
import type { OrderDetail, OrderPayment } from '@/features/orders/types/order-detail'

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
 * against it (Phase 6.5). "Ghi nhận thanh toán" is only offered for a
 * `completed` order that isn't already fully paid — matches
 * `record_order_payment()`'s own guard (see `record-order-payment.ts`), so
 * the button is never shown promising something the RPC would reject.
 *
 * No edit/delete affordance for an existing payment row: a recorded
 * payment is a historical financial event and this schema has no
 * correction/reversal mechanism for it yet (`domain-driven-frontend` rule
 * 16) — see `record-order-payment.ts`'s doc comment.
 */
export function OrderPaymentsCard({ order }: { order: OrderDetail }) {
  const paymentsQuery = useOrderPayments(order.id)
  const [isRecordOpen, setIsRecordOpen] = useState(false)
  const payments = paymentsQuery.data ?? []
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remaining = order.total - totalPaid
  const overpaid = totalPaid > order.total
  const canRecordPayment = order.status === 'completed' && order.paymentStatus !== 'paid'

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle>Tổng cộng &amp; thanh toán</CardTitle>
        {canRecordPayment && (
          <Button size="sm" onClick={() => setIsRecordOpen(true)}>
            <Plus />
            Ghi nhận thanh toán
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Tạm tính" value={formatCurrencyVND(order.subtotal)} />
          <Stat label="Giảm giá" value={formatCurrencyVND(order.discount)} />
          <Stat label="Tổng cộng" value={formatCurrencyVND(order.total)} />
          <Stat label="Đã thanh toán" value={formatCurrencyVND(totalPaid)} />
          <Stat label="Còn lại" value={formatCurrencyVND(Math.max(remaining, 0))} />
          {overpaid && <Stat label="Đã trả dư" value={formatCurrencyVND(totalPaid - order.total)} />}
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

      <RecordPaymentDialog
        key={remaining}
        open={isRecordOpen}
        onOpenChange={setIsRecordOpen}
        orderId={order.id}
        customerId={order.customerId}
        remainingAmount={remaining}
      />
    </Card>
  )
}
