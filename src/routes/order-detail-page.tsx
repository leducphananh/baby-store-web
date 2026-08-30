import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Ban, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import { ROUTES } from '@/routes/route-paths'
import { ExportOrderPdfButton } from '@/features/orders/components/export-order-pdf-button'
import { OrderDetailHeader } from '@/features/orders/components/order-detail-header'
import { OrderLinesCard } from '@/features/orders/components/order-lines-card'
import { OrderPaymentsCard } from '@/features/orders/components/order-payments-card'
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge'
import { PaymentStatusBadge } from '@/features/orders/components/payment-status-badge'
import { useCancelDraftOrder } from '@/features/orders/hooks/use-cancel-draft-order'
import { useCancelOrder } from '@/features/orders/hooks/use-cancel-order'
import { useOrder } from '@/features/orders/hooks/use-order'

function BackLink() {
  return (
    <Link
      to={ROUTES.orders}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Danh sách đơn hàng
    </Link>
  )
}

/**
 * Order Detail (Phase 6.3) + Edit/Cancel actions (Phase 6.4) + PDF export
 * (Phase 6.6). All money values shown here come straight from
 * `orders`/`order_items`, the historical rows written at sale time — never
 * from a product's current price (see `get-order-lines.ts`'s doc comment).
 *
 * Allowed operations are gated strictly by real `status`, never guessed:
 *  - `draft`/`confirmed` — editable (→ Edit Order); "Hủy đơn nháp" just
 *    flips status, since nothing has touched inventory yet.
 *  - `completed` — restricted: no editing (a completed sale's line items
 *    are a financial record), but can still be cancelled — which reverses
 *    the real inventory deduction through traceable transactions (see
 *    `cancel-order.ts`), not a silent stock patch.
 *  - `cancelled` — fully read-only, no actions offered at all.
 *
 * "Xuất PDF" is available regardless of status — it's a read-only document
 * export, not a state-changing action, so it isn't gated the way Edit/Cancel
 * are (see `export-order-pdf-button.tsx`).
 */
function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const orderQuery = useOrder(id)
  const cancelDraftOrder = useCancelDraftOrder()
  const cancelOrder = useCancelOrder()

  const [isCancelDraftOpen, setIsCancelDraftOpen] = useState(false)
  const [isCancelCompletedOpen, setIsCancelCompletedOpen] = useState(false)

  if (orderQuery.isLoading) {
    return <PageLoading />
  }

  if (orderQuery.isError) {
    return (
      <PageContent>
        <BackLink />
        <ErrorState
          message="Không thể tải thông tin đơn hàng. Vui lòng thử lại."
          onRetry={() => void orderQuery.refetch()}
        />
      </PageContent>
    )
  }

  const order = orderQuery.data
  if (!order) {
    return (
      <PageContent>
        <BackLink />
        <EmptyState
          title="Không tìm thấy đơn hàng"
          description="Đơn hàng này có thể không tồn tại hoặc đường dẫn không đúng."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES.orders}>Về danh sách đơn hàng</Link>
            </Button>
          }
        />
      </PageContent>
    )
  }

  const isDraft = order.status === 'draft' || order.status === 'confirmed'
  const isCompleted = order.status === 'completed'

  return (
    <PageContent>
      <BackLink />

      <PageHeader
        title={`Đơn hàng ${order.orderNumber}`}
        description={order.customerName ? `Khách hàng: ${order.customerName}` : 'Khách lẻ'}
        actions={
          <div className="flex items-center gap-2">
            <ExportOrderPdfButton order={order} />
            {isDraft ? (
              <>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={cancelDraftOrder.isPending}
                  onClick={() => setIsCancelDraftOpen(true)}
                >
                  <Ban />
                  Hủy đơn nháp
                </Button>
                <Button onClick={() => navigate(ROUTES.editOrder(order.id))}>
                  <Pencil />
                  Sửa đơn hàng
                </Button>
              </>
            ) : isCompleted ? (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={cancelOrder.isPending}
                onClick={() => setIsCancelCompletedOpen(true)}
              >
                <Ban />
                Hủy đơn hàng
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      <OrderDetailHeader order={order} />
      <OrderLinesCard orderId={order.id} status={order.status} />
      <OrderPaymentsCard order={order} />

      <ConfirmDialog
        open={isCancelDraftOpen}
        onOpenChange={setIsCancelDraftOpen}
        title="Hủy đơn hàng nháp"
        description={
          <>
            Bạn có chắc chắn muốn hủy đơn hàng <strong>{order.orderNumber}</strong>? Đơn hàng chưa
            được ghi nhận vào kho nên sẽ không ảnh hưởng đến tồn kho. Sau khi hủy, đơn hàng sẽ
            chuyển sang trạng thái "Đã hủy" và không thể chỉnh sửa lại.
          </>
        }
        confirmLabel="Hủy đơn nháp"
        variant="destructive"
        isConfirming={cancelDraftOrder.isPending}
        onConfirm={() =>
          cancelDraftOrder.mutate(order.id, { onSettled: () => setIsCancelDraftOpen(false) })
        }
      />

      <ConfirmDialog
        open={isCancelCompletedOpen}
        onOpenChange={setIsCancelCompletedOpen}
        title="Hủy đơn hàng đã hoàn tất?"
        description={
          <>
            Bạn có chắc chắn muốn hủy đơn hàng <strong>{order.orderNumber}</strong>? Toàn bộ số
            lượng đã bán trong đơn sẽ được hoàn trả về đúng các lô hàng đã xuất, có ghi nhận giao
            dịch kho đầy đủ. Thao tác này không thể hoàn tác.
          </>
        }
        confirmLabel="Hủy đơn hàng"
        variant="destructive"
        isConfirming={cancelOrder.isPending}
        onConfirm={() =>
          cancelOrder.mutate(
            { id: order.id, customerId: order.customerId },
            { onSettled: () => setIsCancelCompletedOpen(false) },
          )
        }
      />
    </PageContent>
  )
}

export { OrderDetailPage }
