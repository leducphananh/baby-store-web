import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { IntegerField } from '@/components/common/integer-field'
import { formatDate } from '@/utils/date'
import { formatQuantityWithUnit } from '@/utils/unit'
import { isExpired } from '@/features/batches/utils/expiry'
import { useAdjustInventory } from '@/features/inventory/hooks/use-adjust-inventory'
import {
  buildInventoryAdjustmentFormSchema,
  type InventoryAdjustmentFormValues,
} from '@/features/inventory/schemas/inventory-adjustment-schema'
import {
  INVENTORY_ADJUSTMENT_OPERATION_LABELS,
  INVENTORY_ADJUSTMENT_OPERATION_TYPES,
  STOCK_COUNT_OPERATION_TYPE,
  type AdjustableBatch,
  type InventoryAdjustmentOperationType,
} from '@/features/inventory/types/inventory-adjustment'

const FORM_ID = 'inventory-adjustment-form'

function isWriteOff(operationType: InventoryAdjustmentOperationType): boolean {
  return operationType !== STOCK_COUNT_OPERATION_TYPE
}

/**
 * Reusable dialog for manual inventory adjustment/write-off (Phase 8.4) —
 * opened from a batch row in either Product Detail's batch table or the
 * Expiry Report's batch table (the two entry points this phase supports,
 * requirement §53). Always batch-level (requirement §7): `batch` is a
 * specific, already-known `product_batches` row, never a vague
 * product-level deduction.
 *
 * Client-side validation is for immediate feedback only
 * (`buildInventoryAdjustmentFormSchema`) — `adjust_inventory()` re-checks
 * everything against the row-locked current quantity server-side
 * (requirement §41/§61/§124). If the batch changed since this dialog
 * opened (someone else adjusted it), the server rejects and
 * `getAdjustInventoryErrorMessage` surfaces a Vietnamese "reload and retry"
 * message rather than silently retrying a destructive mutation
 * (requirement §62).
 */
export function InventoryAdjustmentDialog({
  open,
  onOpenChange,
  batch,
  defaultOperationType,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  batch: AdjustableBatch | null
  /** Prefill for a specific entry point (e.g. "Hủy hàng" on an expired Expiry Report row) — the user can still change it unless it isn't applicable to this batch. */
  defaultOperationType?: InventoryAdjustmentOperationType
}) {
  const adjustInventory = useAdjustInventory()
  const currentQuantity = batch?.remainingQuantity ?? 0
  const batchIsExpired = isExpired(batch?.expirationDate ?? null)

  const schema = useMemo(() => buildInventoryAdjustmentFormSchema(currentQuantity), [currentQuantity])

  const defaultValues: InventoryAdjustmentFormValues = {
    operationType: defaultOperationType ?? 'DAMAGE',
    writeOffQuantity: 1,
    actualQuantity: currentQuantity,
    note: '',
  }

  const form = useForm<InventoryAdjustmentFormValues>({
    resolver: zodResolver(schema),
    values: defaultValues,
  })

  const operationType = useWatch({ control: form.control, name: 'operationType' })
  const writeOffQuantity = useWatch({ control: form.control, name: 'writeOffQuantity' })
  const actualQuantity = useWatch({ control: form.control, name: 'actualQuantity' })

  // Live preview only — the server computes the real new quantity/delta
  // from the row-locked value at submit time (requirement §124); this is
  // never sent to the RPC.
  const previewNewQuantity = isWriteOff(operationType)
    ? Math.max(currentQuantity - (writeOffQuantity || 0), 0)
    : actualQuantity

  function handleSubmit(values: InventoryAdjustmentFormValues) {
    if (!batch) return
    adjustInventory.mutate(
      {
        batchId: batch.batchId,
        operationType: values.operationType,
        writeOffQuantity: isWriteOff(values.operationType) ? values.writeOffQuantity : undefined,
        actualQuantity: values.operationType === STOCK_COUNT_OPERATION_TYPE ? values.actualQuantity : undefined,
        note: values.note,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog
      open={open}
      // Phase 9.8 (Debt B): don't let Escape / overlay-click dismiss the
      // dialog while the adjust_inventory RPC is in flight — the footer
      // buttons are already disabled, and closing here would wrongly imply
      // the write-off / stock count was cancelled when the server call is
      // still running and authoritative.
      onOpenChange={(next) => {
        if (adjustInventory.isPending) return
        onOpenChange(next)
      }}
    >
      <DialogContent onCloseAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
          <DialogDescription>
            {batch ? (
              <>
                {batch.productName}
                {batch.lotNumber ? ` — Lô ${batch.lotNumber}` : ''}
              </>
            ) : (
              ''
            )}
          </DialogDescription>
        </DialogHeader>

        {batch && (
          <Form {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="operationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lý do</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as InventoryAdjustmentOperationType)}
                      disabled={adjustInventory.isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INVENTORY_ADJUSTMENT_OPERATION_TYPES.map((value) => (
                          <SelectItem key={value} value={value} disabled={value === 'EXPIRED' && !batchIsExpired}>
                            {INVENTORY_ADJUSTMENT_OPERATION_LABELS[value]}
                            {value === 'EXPIRED' && !batchIsExpired ? ' (lô chưa hết hạn)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isWriteOff(operationType) ? (
                <div className="space-y-1">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <IntegerField
                        control={form.control}
                        name="writeOffQuantity"
                        label="Số lượng hủy"
                        disabled={adjustInventory.isPending}
                        autoFocus
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={adjustInventory.isPending}
                      onClick={() => form.setValue('writeOffQuantity', currentQuantity, { shouldValidate: true })}
                    >
                      Hủy toàn bộ ({formatQuantityWithUnit(currentQuantity, batch.unit)})
                    </Button>
                  </div>
                </div>
              ) : (
                <IntegerField
                  control={form.control}
                  name="actualQuantity"
                  label="Số lượng thực tế (kiểm kê)"
                  description={`Tồn hiện tại theo hệ thống: ${formatQuantityWithUnit(currentQuantity, batch.unit)}`}
                  disabled={adjustInventory.isPending}
                  autoFocus
                />
              )}

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Ghi chú
                      {operationType === 'MANUAL_ADJUSTMENT' && <span className="text-destructive"> *</span>}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          operationType === 'MANUAL_ADJUSTMENT' ? 'Bắt buộc — mô tả lý do điều chỉnh' : 'Không bắt buộc'
                        }
                        disabled={adjustInventory.isPending}
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirmation summary (requirement §63) — always visible, not a separate step, so the effect of the current form values is never a surprise. */}
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <dl className="grid grid-cols-2 gap-y-1">
                  <dt className="text-muted-foreground">Tồn hiện tại</dt>
                  <dd className="text-right font-medium">{formatQuantityWithUnit(currentQuantity, batch.unit)}</dd>
                  {batch.expirationDate && (
                    <>
                      <dt className="text-muted-foreground">Hạn sử dụng</dt>
                      <dd className="text-right">{formatDate(batch.expirationDate)}</dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">Tồn sau điều chỉnh</dt>
                  <dd className="text-right font-semibold text-foreground">
                    {formatQuantityWithUnit(previewNewQuantity, batch.unit)}
                  </dd>
                </dl>
              </div>
            </form>
          </Form>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={adjustInventory.isPending}>
            Hủy
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant={isWriteOff(operationType) ? 'destructive' : 'default'}
            disabled={adjustInventory.isPending || !batch}
          >
            {adjustInventory.isPending ? 'Đang lưu...' : 'Xác nhận điều chỉnh'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
