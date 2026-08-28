import type { UseFormReturn } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ImportReceiptForm } from '@/features/import-receipts/components/import-receipt-form'
import { useCreateImportReceipt } from '@/features/import-receipts/hooks/use-create-import-receipt'
import { useNextReceiptNumber } from '@/features/import-receipts/hooks/use-next-receipt-number'
import { useUpdateImportReceipt } from '@/features/import-receipts/hooks/use-update-import-receipt'
import type { ImportReceiptFormValues } from '@/features/import-receipts/schemas/import-receipt-schema'
import { getImportReceiptUniqueField } from '@/features/import-receipts/utils/get-import-receipt-error-message'
import { toDateInputValue, todayYmd } from '@/features/import-receipts/utils/import-receipt-date'
import type { ImportReceipt } from '@/features/import-receipts/types/import-receipt'

const FORM_ID = 'import-receipt-form'

/**
 * Create / edit dialog for an import-receipt **header**. Edit is only ever
 * opened for a `draft` receipt (the list/detail gate the action); the update
 * mutation re-checks server-side regardless.
 */
export function ImportReceiptFormDialog({
  open,
  onOpenChange,
  receipt,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt?: ImportReceipt
}) {
  const isEditMode = Boolean(receipt)
  const createReceipt = useCreateImportReceipt()
  const updateReceipt = useUpdateImportReceipt()
  const nextNumberQuery = useNextReceiptNumber(open && !isEditMode)

  const isSubmitting = createReceipt.isPending || updateReceipt.isPending
  const isPreparing = open && !isEditMode && nextNumberQuery.isLoading

  function handleSubmit(values: ImportReceiptFormValues, form: UseFormReturn<ImportReceiptFormValues>) {
    const onError = (error: unknown) => {
      if (getImportReceiptUniqueField(error)) {
        form.setError('receiptNumber', { type: 'server', message: 'Mã phiếu nhập đã tồn tại' })
      }
    }

    if (receipt) {
      updateReceipt.mutate(
        { id: receipt.id, values },
        { onSuccess: () => onOpenChange(false), onError },
      )
    } else {
      createReceipt.mutate(values, { onSuccess: () => onOpenChange(false), onError })
    }
  }

  const defaultValues: ImportReceiptFormValues = receipt
    ? {
        receiptNumber: receipt.receiptNumber,
        supplierId: receipt.supplierId ?? '',
        importDate: toDateInputValue(receipt.importDate) || todayYmd(),
        notes: receipt.notes ?? '',
      }
    : {
        receiptNumber: nextNumberQuery.data ?? '',
        supplierId: '',
        importDate: todayYmd(),
        notes: '',
      }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Sửa phiếu nhập' : 'Tạo phiếu nhập'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Cập nhật thông tin phiếu nhập "${receipt?.receiptNumber}" (chỉ khi còn ở trạng thái nháp).`
              : 'Tạo phiếu nhập ở trạng thái nháp. Nhập chi tiết hàng hóa và ghi vào kho sẽ thực hiện ở bước sau.'}
          </DialogDescription>
        </DialogHeader>

        {isPreparing ? (
          <div className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <ImportReceiptForm
            key={receipt?.id ?? `create-${nextNumberQuery.data ?? 'new'}`}
            formId={FORM_ID}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting || isPreparing}>
            {isSubmitting ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Tạo phiếu nhập'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
