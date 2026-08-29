import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { IntegerField } from '@/components/common/integer-field'
import { ProductComboBox } from '@/features/products/components/product-combobox'
import type { ProductSearchResult } from '@/features/products/api/search-products'
import { useAddImportReceiptItem } from '@/features/import-receipts/hooks/use-add-import-receipt-item'
import {
  importReceiptLineFormSchema,
  type ImportReceiptLineFormValues,
} from '@/features/import-receipts/schemas/import-receipt-line-schema'

/**
 * The rapid-entry "add a line" affordance the Phase 4.2 task asks for —
 * feels like a purchasing form (pick product → adjust quantity/price/lot →
 * Enter → next product), not a generic "open a dialog per row" CRUD flow.
 *
 * Two-step by design: `ProductComboBox` alone until a product is picked,
 * then an inline form row for the rest of the line's fields. Splitting it
 * this way keeps the common case (search, pick, accept the defaults, go to
 * the next item) to two clicks/keys, while still validating everything
 * through the same Zod schema as editing.
 *
 * Same product can be added more than once on one receipt — e.g. two
 * different lots/expiry dates of the same product arriving in one
 * shipment each become their own line (and, once the receipt is
 * confirmed, their own `product_batches` row) — see
 * `import-receipt-line-schema.ts` and `domain-driven-frontend`. This is
 * intentional, not a bug to guard against.
 */
function ImportReceiptLineAddPanel({ receiptId }: { receiptId: string }) {
  const [pendingProduct, setPendingProduct] = useState<ProductSearchResult | null>(null)
  const addItem = useAddImportReceiptItem(receiptId)

  if (!pendingProduct) {
    return (
      <div className="max-w-sm">
        <ProductComboBox onSelect={setPendingProduct} disabled={addItem.isPending} />
      </div>
    )
  }

  return (
    <PendingLineForm
      product={pendingProduct}
      isSubmitting={addItem.isPending}
      onCancel={() => setPendingProduct(null)}
      onSubmit={(values) => {
        addItem.mutate(
          { receiptId, productId: pendingProduct.id, ...values },
          { onSuccess: () => setPendingProduct(null) },
        )
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
  onSubmit: (values: ImportReceiptLineFormValues) => void
}) {
  const form = useForm<ImportReceiptLineFormValues>({
    resolver: zodResolver(importReceiptLineFormSchema),
    defaultValues: {
      quantity: 1,
      purchasePrice: product.defaultPurchasePrice,
      lotNumber: '',
      manufactureDate: '',
      expirationDate: '',
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3"
        noValidate
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">{product.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
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
          <div className="w-28">
            <IntegerField
              control={form.control}
              name="purchasePrice"
              label="Đơn giá"
              disabled={isSubmitting}
            />
          </div>
          <FormField
            control={form.control}
            name="lotNumber"
            render={({ field }) => (
              <FormItem className="w-32">
                <FormLabel>Số lô</FormLabel>
                <FormControl>
                  <Input placeholder="Không bắt buộc" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="manufactureDate"
            render={({ field }) => (
              <FormItem className="w-40">
                <FormLabel>Ngày sản xuất</FormLabel>
                <FormControl>
                  <Input type="date" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expirationDate"
            render={({ field }) => (
              <FormItem className="w-40">
                <FormLabel>Hạn sử dụng</FormLabel>
                <FormControl>
                  <Input type="date" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="sm" disabled={isSubmitting} className="mb-0.5">
            <Plus />
            {isSubmitting ? 'Đang thêm...' : 'Thêm'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export { ImportReceiptLineAddPanel }
