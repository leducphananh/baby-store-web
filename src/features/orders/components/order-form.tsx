import { useState } from 'react'
import { useNavigate } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrencyVND } from '@/utils/currency'
import { formatQuantityWithUnit } from '@/utils/unit'
import { CustomerComboBox } from '@/features/customers/components/customer-combobox'
import { CustomerFormDialog } from '@/features/customers/components/customer-form-dialog'
import type { CustomerSearchResult } from '@/features/customers/api/search-customers'
import { OrderCartTable } from '@/features/orders/components/order-cart-table'
import { OrderLineAddPanel } from '@/features/orders/components/order-line-add-panel'
import { orderFormSchema, type OrderFormValues } from '@/features/orders/schemas/order-form-schema'
import type { ProductSearchResult } from '@/features/products/api/search-products'

/**
 * The order-building form shared by Create Order (Phase 6.2) and Edit Order
 * (Phase 6.4) — customer pick, cart, note, running total — everything here
 * is local `react-hook-form` state; nothing is persisted until `onSubmit`
 * fires, so both callers can submit the whole thing in one atomic RPC call
 * (`create_order`/`update_order_draft`) and neither has to reimplement the
 * cart-editing UI. The two pages differ only in copy, default values, and
 * what the submit actually calls — everything else is identical, which is
 * exactly why this was pulled out once Edit needed the same screen (see
 * `clean-code`).
 */
export function OrderForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  submittingLabel,
  cancelHref,
}: {
  defaultValues: OrderFormValues
  onSubmit: (values: OrderFormValues) => void
  isSubmitting: boolean
  submitLabel: string
  submittingLabel: string
  cancelHref: string
}) {
  const navigate = useNavigate()
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false)

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
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

  const itemsRootError = formState.errors.items?.message

  return (
    <>
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
                    disabled={isSubmitting}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sản phẩm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="max-w-sm">
                    <OrderLineAddPanel onAdd={handleAddLine} disabled={isSubmitting} />
                  </div>

                  <OrderCartTable control={control} fields={fields} onRemove={remove} disabled={isSubmitting} />
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
                          <Textarea placeholder="Không bắt buộc" rows={3} disabled={isSubmitting} {...field} />
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

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? submittingLabel : submitLabel}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={() => navigate(cancelHref)}
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
    </>
  )
}
