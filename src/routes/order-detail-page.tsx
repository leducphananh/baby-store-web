import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import { ROUTES } from '@/routes/route-paths'
import { OrderDetailHeader } from '@/features/orders/components/order-detail-header'
import { OrderLinesCard } from '@/features/orders/components/order-lines-card'
import { OrderPaymentsCard } from '@/features/orders/components/order-payments-card'
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge'
import { PaymentStatusBadge } from '@/features/orders/components/payment-status-badge'
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
 * Order Detail (Phase 6.3) — read-only, no lifecycle actions (confirm/
 * complete/cancel is a later phase, same discipline as Phases 6.1/6.2). All
 * money values shown here come straight from `orders`/`order_items`, the
 * historical rows written at sale time — never from a product's current
 * price (see `get-order-lines.ts`'s doc comment for why that's a real
 * hazard this page deliberately avoids).
 */
function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const orderQuery = useOrder(id)

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

  return (
    <PageContent>
      <BackLink />

      <PageHeader
        title={`Đơn hàng ${order.orderNumber}`}
        description={order.customerName ? `Khách hàng: ${order.customerName}` : 'Khách lẻ'}
      />

      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      <OrderDetailHeader order={order} />
      <OrderLinesCard orderId={order.id} status={order.status} />
      <OrderPaymentsCard order={order} />
    </PageContent>
  )
}

export { OrderDetailPage }
