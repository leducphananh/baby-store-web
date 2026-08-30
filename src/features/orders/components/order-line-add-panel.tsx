import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { IntegerField } from '@/components/common/integer-field'
import { formatQuantityWithUnit } from '@/utils/unit'
import { ProductComboBox } from '@/features/products/components/product-combobox'
import type { ProductSearchResult } from '@/features/products/api/search-products'
import {
  createOrderLineFormSchema,
  type OrderLineFormValues,
} from '@/features/orders/schemas/order-line-schema'

/**
 * The cart's "add a line" affordance — same two-step shape as
 * `ImportReceiptLineAddPanel` (pick product → adjust quantity/price →
 * confirm), but purely local: it hands the picked product + quantity/price
 * to `onAdd` and never talks to the server itself. The whole order is
 * submitted as one atomic call once the cart is ready (see
 * `create-order-page.tsx`) — nothing here is persisted until then.
 *
 * `ProductComboBox` is asked for *sellable* stock only (`sellableOnly`,
 * `stockLabel="Có thể bán"`) — a product with only expired batches left
 * shows 0 here, matching what `create_order()`'s FEFO allocation could
 * actually sell, not the raw batch total shown elsewhere (e.g. import
 * receipt lines, where expiry doesn't gate receiving more stock).
 */
function OrderLineAddPanel({
  onAdd,
  disabled,
}: {
  onAdd: (input: { product: ProductSearchResult; quantity: number; unitPrice: number }) => void
  disabled?: boolean
}) {
  const [pendingProduct, setPendingProduct] = useState<ProductSearchResult | null>(null)

  if (!pendingProduct) {
    return (
      <ProductComboBox
        onSelect={setPendingProduct}
        disabled={disabled}
        sellableOnly
        stockLabel="Có thể bán"
        placeholder="Tìm theo tên, SKU hoặc mã vạch..."
      />
    )
  }

  return (
    <PendingLineForm
      product={pendingProduct}
      isSubmitting={Boolean(disabled)}
      onCancel={() => setPendingProduct(null)}
      onSubmit={(values) => {
        onAdd({ product: pendingProduct, ...values })
        setPendingProduct(null)
      }}
    />
  )
}

function PendingLineForm({
  product,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  product: ProductSearchResult
  isSubmitting: boolean
  onCancel: () => void
  onSubmit: (values: OrderLineFormValues) => void
}) {
  const form = useForm<OrderLineFormValues>({
    resolver: zodResolver(createOrderLineFormSchema(product.stockQuantity)),
    defaultValues: {
      quantity: 1,
      unitPrice: product.sellingPrice,
    },
  })

  const submit = form.handleSubmit(onSubmit)

  return (
    <Form {...form}>
      {/* A plain `<div>`, not a nested `<form>`: this panel renders inside
          the Create Order page's own page-level `<form>` (unlike
          `ImportReceiptLineAddPanel`, which never nests inside another
          form), and a `<form>` inside a `<form>` is invalid HTML with
          unpredictable submit-event bubbling. Enter-to-submit is wired
          manually below instead of relying on native form submission. */}
      <div
        className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            void submit()
          }
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">{product.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {product.sku} · Có thể bán: {formatQuantityWithUnit(product.stockQuantity, product.unit)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Hủy thêm sản phẩm"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-24">
            <IntegerField
              control={form.control}
              name="quantity"
              label="Số lượng"
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          <div className="w-32">
            <IntegerField
              control={form.control}
              name="unitPrice"
              label="Đơn giá bán"
              disabled={isSubmitting}
            />
          </div>

          <Button type="button" size="sm" disabled={isSubmitting} className="mb-0.5" onClick={() => void submit()}>
            <Plus />
            Thêm vào đơn
          </Button>
        </div>
      </div>
    </Form>
  )
}

export { OrderLineAddPanel }
