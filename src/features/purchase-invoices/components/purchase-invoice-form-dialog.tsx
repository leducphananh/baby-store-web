import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
// Pure "today as YYYY-MM-DD in the viewer's timezone" helper — lives in the
// import-receipts feature but is domain-agnostic; reused here rather than
// duplicating the same date logic (CLAUDE.md §12).
import { todayYmd } from '@/features/import-receipts/utils/import-receipt-date'
import { PurchaseInvoiceForm } from '@/features/purchase-invoices/components/purchase-invoice-form'
import { useCreatePurchaseInvoice } from '@/features/purchase-invoices/hooks/use-create-purchase-invoice'
import { useUpdatePurchaseInvoice } from '@/features/purchase-invoices/hooks/use-update-purchase-invoice'
import type { PurchaseInvoiceFormValues } from '@/features/purchase-invoices/schemas/purchase-invoice-schema'
import type { PurchaseInvoice } from '@/features/purchase-invoices/types/purchase-invoice'

const FORM_ID = 'purchase-invoice-form'

/**
 * Create / edit dialog for a purchase-invoice header. Attachments are managed
 * separately on the invoice card once the invoice exists.
 */
export function PurchaseInvoiceFormDialog({
  open,
  onOpenChange,
  importReceiptId,
  invoice,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  importReceiptId: string
  invoice?: PurchaseInvoice
}) {
  const isEditMode = Boolean(invoice)
  const createInvoice = useCreatePurchaseInvoice(importReceiptId)
  const updateInvoice = useUpdatePurchaseInvoice(importReceiptId)

  const isSubmitting = createInvoice.isPending || updateInvoice.isPending

  function handleSubmit(values: PurchaseInvoiceFormValues) {
    if (invoice) {
      updateInvoice.mutate(
        { id: invoice.id, values },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      createInvoice.mutate(values, { onSuccess: () => onOpenChange(false) })
    }
  }

  const defaultValues: PurchaseInvoiceFormValues = invoice
    ? {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        notes: invoice.notes ?? '',
      }
    : { invoiceNumber: '', invoiceDate: todayYmd(), notes: '' }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" onCloseAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Sửa hóa đơn' : 'Thêm hóa đơn'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Cập nhật thông tin hóa đơn "${invoice?.invoiceNumber}".`
              : 'Ghi nhận một hóa đơn GTGT / hóa đơn đỏ cho phiếu nhập này. Tệp đính kèm được tải lên sau khi tạo.'}
          </DialogDescription>
        </DialogHeader>

        <PurchaseInvoiceForm
          key={invoice?.id ?? 'create'}
          formId={FORM_ID}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Thêm hóa đơn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
