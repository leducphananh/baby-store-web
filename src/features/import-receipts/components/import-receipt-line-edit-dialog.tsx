import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { IntegerField } from '@/components/common/integer-field'
import { useUpdateImportReceiptItem } from '@/features/import-receipts/hooks/use-update-import-receipt-item'
import {
  importReceiptLineFormSchema,
  type ImportReceiptLineFormValues,
} from '@/features/import-receipts/schemas/import-receipt-line-schema'
import type { ImportReceiptLine } from '@/features/import-receipts/types/import-receipt'

const FORM_ID = 'import-receipt-line-edit-form'

/**
 * Edit an existing line — quantity, purchase price, lot/dates. The product
 * itself isn't editable here (see `import-receipt-line-schema.ts`). A
 * Dialog, unlike the inline add row: editing an existing line is a less
 * frequent, corrective action, not the rapid-entry path the "purchasing
 * form" UX goal is really about — see `ImportReceiptLineAddPanel` for that.
 */
function ImportReceiptLineEditDialog({
  open,
  onOpenChange,
  receiptId,
  line,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  receiptId: string
  line: ImportReceiptLine | null
}) {
  const updateItem = useUpdateImportReceiptItem(receiptId)

  const defaultValues: ImportReceiptLineFormValues = {
    quantity: line?.quantity ?? 1,
    purchasePrice: line?.purchasePrice ?? 0,
    lotNumber: line?.lotNumber ?? '',
    manufactureDate: line?.manufactureDate ?? '',
    expirationDate: line?.expirationDate ?? '',
  }

  const form = useForm<ImportReceiptLineFormValues>({
    resolver: zodResolver(importReceiptLineFormSchema),
    values: defaultValues,
  })

  function handleSubmit(values: ImportReceiptLineFormValues) {
    if (!line) return
    updateItem.mutate({ itemId: line.id, ...values }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Sửa dòng hàng</DialogTitle>
          <DialogDescription>{line?.productName ?? ''}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-2 gap-4">
              <IntegerField
                control={form.control}
                name="quantity"
                label="Số lượng"
                disabled={updateItem.isPending}
                autoFocus
              />
              <IntegerField
                control={form.control}
                name="purchasePrice"
                label="Đơn giá"
                disabled={updateItem.isPending}
              />
            </div>

            <FormField
              control={form.control}
              name="lotNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số lô</FormLabel>
                  <FormControl>
                    <Input placeholder="Không bắt buộc" disabled={updateItem.isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufactureDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày sản xuất</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={updateItem.isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hạn sử dụng</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={updateItem.isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateItem.isPending}
          >
            Hủy
          </Button>
          <Button type="submit" form={FORM_ID} disabled={updateItem.isPending}>
            {updateItem.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ImportReceiptLineEditDialog }
