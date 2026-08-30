import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { formatCurrencyVND } from '@/utils/currency'
import { formatQuantityWithUnit } from '@/utils/unit'
import { ROUTES } from '@/routes/route-paths'
import { CustomerComboBox } from '@/features/customers/components/customer-combobox'
import { CustomerFormDialog } from '@/features/customers/components/customer-form-dialog'
import type { CustomerSearchResult } from '@/features/customers/api/search-customers'
import { OrderCartTable } from '@/features/orders/components/order-cart-table'
import { OrderLineAddPanel } from '@/features/orders/components/order-line-add-panel'
import { useCreateOrder } from '@/features/orders/hooks/use-create-order'
import { getCreateOrderErrorMessage } from '@/features/orders/utils/get-create-order-error-message'
import { orderFormSchema, type OrderFormValues } from '@/features/orders/schemas/order-form-schema'
import type { ProductSearchResult } from '@/features/products/api/search-products'

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
 * Fast internal point-of-sale screen (Phase 6.2). Everything here — the
 * customer pick, the cart — is local `react-hook-form` state; nothing is
 * persisted until "Tạo đơn hàng" is pressed, which submits the whole order
 * in one atomic `create_order()` call (see `use-create-order.ts`). There is
 * no per-line save, no draft order sitting half-built server-side: either
 * the full sale goes through — order, items, FEFO inventory deduction — or
 * none of it does.
 */
function CreateOrderPage() {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false)

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const { control, handleSubmit, setValue, formState } = form
  const { fields, append, update, remove } = useFieldArray({ control, name: 'items' })

  const customerName = useWatch({ control, name: 'customerName' })
  const watchedItems = useWatch({ control, name: 'items' })
  const itemCount = watchedItems?.length ?? 0
  const total = (watchedItems ?? []).reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0,
  )

  function handleSelectCustomer(customer: CustomerSearchResult) {
    setValue('customerId', customer.id)
    setValue('customerName', customer.name)
  }

  function handleClearCustomer() {
    setValue('customerId', null)
    setValue('customerName', null)
  }

  function handleAddLine({
    product,
    quantity,
    unitPrice,
  }: {
    product: ProductSearchResult
    quantity: number
    unitPrice: number
  }) {
    const existingIndex = fields.findIndex((field) => field.productId === product.id)
    if (existingIndex >= 0) {
      const existing = fields[existingIndex]
      update(existingIndex, {
        ...existing,
        // Same product added again: merge into the existing line rather
        // than a second row for it, capped at what's actually sellable.
        quantity: Math.min(existing.quantity + quantity, product.stockQuantity),
        unitPrice,
        availableQuantity: product.stockQuantity,
      })
    } else {
      append({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        unit: product.unit,
        quantity,
        unitPrice,
        availableQuantity: product.stockQuantity,
      })
    }
  }

  function onSubmit(values: OrderFormValues) {
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

  const itemsRootError = formState.errors.items?.message

  return (
    <PageContent>
      <BackLink />
      <PageHeader title="Tạo đơn hàng" description="Point-of-sale nhanh: chọn khách hàng, thêm sản phẩm và tạo đơn." />

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Khách hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomerComboBox
                    selectedLabel={customerName}
                    onSelect={handleSelectCustomer}
                    onClear={handleClearCustomer}
                    onCreateNew={() => setIsCreateCustomerOpen(true)}
                    disabled={createOrder.isPending}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sản phẩm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="max-w-sm">
                    <OrderLineAddPanel onAdd={handleAddLine} disabled={createOrder.isPending} />
                  </div>

                  <OrderCartTable
                    control={control}
                    fields={fields}
                    onRemove={remove}
                    disabled={createOrder.isPending}
                  />
                  {itemsRootError && <p className="text-sm text-destructive">{itemsRootError}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ghi chú</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Ghi chú</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Không bắt buộc"
                            rows={3}
                            disabled={createOrder.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-4">
                <CardHeader>
                  <CardTitle>Tổng cộng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Số sản phẩm</span>
                    <span className="text-foreground">{formatQuantityWithUnit(itemCount, 'sản phẩm')}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4 text-base font-semibold">
                    <span className="text-foreground">Tổng tiền</span>
                    <span className="text-foreground">{formatCurrencyVND(total)}</span>
                  </div>

                  <Button type="submit" className="w-full" disabled={createOrder.isPending}>
                    {createOrder.isPending ? 'Đang tạo đơn hàng...' : 'Tạo đơn hàng'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={createOrder.isPending}
                    onClick={() => navigate(ROUTES.orders)}
                  >
                    Hủy
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>

      <CustomerFormDialog
        open={isCreateCustomerOpen}
        onOpenChange={setIsCreateCustomerOpen}
        onCreated={(customer) => {
          setValue('customerId', customer.id)
          setValue('customerName', customer.name)
        }}
      />
    </PageContent>
  )
}

export { CreateOrderPage }
