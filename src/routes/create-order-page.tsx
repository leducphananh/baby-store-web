import { Link, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { ROUTES } from '@/routes/route-paths'
import { OrderForm } from '@/features/orders/components/order-form'
import { useCreateOrder } from '@/features/orders/hooks/use-create-order'
import { getCreateOrderErrorMessage } from '@/features/orders/utils/get-create-order-error-message'
import type { OrderFormValues } from '@/features/orders/schemas/order-form-schema'

const DEFAULT_VALUES: OrderFormValues = {
  customerId: null,
  customerName: null,
  note: '',
  items: [],
}

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
 * Fast internal point-of-sale screen (Phase 6.2). Submits the whole order
 * in one atomic `create_order()` call (see `use-create-order.ts`) — either
 * the full sale goes through, or none of it does. The actual form is
 * `OrderForm`, shared with Edit Order (Phase 6.4); this page only supplies
 * empty defaults and what "submit" means here.
 */
function CreateOrderPage() {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()

  function handleSubmit(values: OrderFormValues) {
    if (createOrder.isPending) return

    createOrder.mutate(
      {
        customerId: values.customerId,
        note: values.note,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
      {
        onSuccess: (result) => {
          toast.success(`Đã tạo đơn hàng ${result.orderNumber}.`)
          navigate(ROUTES.orders)
        },
        onError: (error) => {
          toast.error(getCreateOrderErrorMessage(error, values.items))
        },
      },
    )
  }

  return (
    <PageContent>
      <BackLink />
      <PageHeader
        title="Tạo đơn hàng"
        description="Point-of-sale nhanh: chọn khách hàng, thêm sản phẩm và tạo đơn."
      />
      <OrderForm
        defaultValues={DEFAULT_VALUES}
        onSubmit={handleSubmit}
        isSubmitting={createOrder.isPending}
        submitLabel="Tạo đơn hàng"
        submittingLabel="Đang tạo đơn hàng..."
        cancelHref={ROUTES.orders}
      />
    </PageContent>
  )
}

export { CreateOrderPage }
