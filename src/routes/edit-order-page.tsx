import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import { ROUTES } from '@/routes/route-paths'
import { OrderForm } from '@/features/orders/components/order-form'
import { useOrder } from '@/features/orders/hooks/use-order'
import { useOrderLines } from '@/features/orders/hooks/use-order-lines'
import { useUpdateOrderDraft } from '@/features/orders/hooks/use-update-order-draft'
import { getUpdateOrderDraftErrorMessage } from '@/features/orders/utils/get-update-order-draft-error-message'
import type { OrderFormValues } from '@/features/orders/schemas/order-form-schema'
import { useProductStockMap } from '@/features/products/hooks/use-product-stock-map'

function BackLink({ orderId }: { orderId: string }) {
  return (
    <Link
      to={ROUTES.orderDetail(orderId)}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Chi tiết đơn hàng
    </Link>
  )
}

/**
 * Edit Order (Phase 6.4) — only reachable for a `draft`/`confirmed` order
 * (rule #11, `domain-driven-frontend`: a `completed` order's line items are
 * a financial record, never retroactively editable — see
 * `order-detail-page.tsx`, which only offers this link for those two
 * statuses in the first place). If someone reaches this URL for an order
 * that stopped being editable in the meantime, this shows a clear message
 * instead of a form that would just fail on submit.
 *
 * Reuses `OrderForm` (shared with Create Order) for the actual editing UI;
 * this page's job is only loading the order into `OrderFormValues` shape
 * and wiring the atomic `update_order_draft()` submit.
 */
function EditOrderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const orderQuery = useOrder(id)
  const linesQuery = useOrderLines(id ?? '')
  const updateOrderDraft = useUpdateOrderDraft()

  const productIds = useMemo(() => {
    const ids = (linesQuery.data ?? [])
      .map((line) => line.productId)
      .filter((productId): productId is string => productId !== null)
    return Array.from(new Set(ids))
  }, [linesQuery.data])
  const stockMapQuery = useProductStockMap(productIds)

  const isLoading =
    orderQuery.isLoading || linesQuery.isLoading || (productIds.length > 0 && stockMapQuery.isLoading)

  if (isLoading) {
    return <PageLoading />
  }

  if (orderQuery.isError || linesQuery.isError || stockMapQuery.isError) {
    return (
      <PageContent>
        {id && <BackLink orderId={id} />}
        <ErrorState
          message="Không thể tải thông tin đơn hàng. Vui lòng thử lại."
          onRetry={() => {
            void orderQuery.refetch()
            void linesQuery.refetch()
            void stockMapQuery.refetch()
          }}
        />
      </PageContent>
    )
  }

  const order = orderQuery.data
  if (!order) {
    return (
      <PageContent>
        <BackLink orderId={id ?? ''} />
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

  if (order.status !== 'draft' && order.status !== 'confirmed') {
    return (
      <PageContent>
        <BackLink orderId={order.id} />
        <EmptyState
          title="Không thể chỉnh sửa đơn hàng này"
          description={
            order.status === 'completed'
              ? 'Đơn hàng đã hoàn tất — dòng hàng và giá bán là hồ sơ lịch sử, không thể sửa lại. Nếu cần thay đổi, hãy hủy đơn để hoàn kho rồi tạo đơn mới.'
              : 'Đơn hàng đã bị hủy nên không thể chỉnh sửa.'
          }
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES.orderDetail(order.id)}>Về chi tiết đơn hàng</Link>
            </Button>
          }
        />
      </PageContent>
    )
  }

  const stockMap = stockMapQuery.data ?? new Map<string, number>()
  const defaultValues: OrderFormValues = {
    customerId: order.customerId,
    customerName: order.customerName,
    note: order.note ?? '',
    items: (linesQuery.data ?? []).map((line) => ({
      productId: line.productId ?? '',
      productName: line.productName ?? '',
      productSku: line.productSku ?? '',
      unit: line.productUnit ?? '',
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      availableQuantity: line.productId ? (stockMap.get(line.productId) ?? 0) : 0,
    })),
  }

  const orderId = order.id

  function handleSubmit(values: OrderFormValues) {
    if (updateOrderDraft.isPending) return

    updateOrderDraft.mutate(
      {
        orderId,
        customerId: values.customerId,
        note: values.note,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Đã lưu thay đổi đơn hàng.')
          navigate(ROUTES.orderDetail(orderId))
        },
        onError: (error) => {
          toast.error(getUpdateOrderDraftErrorMessage(error))
        },
      },
    )
  }

  return (
    <PageContent>
      <BackLink orderId={order.id} />
      <PageHeader
        title={`Sửa đơn hàng ${order.orderNumber}`}
        description="Đơn hàng còn ở trạng thái nháp nên có thể chỉnh sửa tự do."
      />
      <OrderForm
        key={order.id}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isSubmitting={updateOrderDraft.isPending}
        submitLabel="Lưu thay đổi"
        submittingLabel="Đang lưu..."
        cancelHref={ROUTES.orderDetail(order.id)}
      />
    </PageContent>
  )
}

export { EditOrderPage }
