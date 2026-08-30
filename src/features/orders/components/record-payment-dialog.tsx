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
import { formatCurrencyVND } from '@/utils/currency'
import { useRecordOrderPayment } from '@/features/orders/hooks/use-record-order-payment'
import {
  orderPaymentFormSchema,
  type OrderPaymentFormValues,
} from '@/features/orders/schemas/order-payment-schema'
import { PAYMENT_METHOD_LABEL } from '@/features/orders/utils/payment-method-label'

const FORM_ID = 'record-payment-form'

const DEFAULT_VALUES: OrderPaymentFormValues = {
  amount: 0,
  paymentMethod: 'cash',
  note: '',
}

/**
 * Records one payment against a completed order (see
 * `use-record-order-payment.ts`) — always the current amount tendered
 * `now()` (see the RPC's own doc comment: `paid_at` isn't user-editable, so
 * a payment's date can't be quietly backdated). `remainingAmount` is shown
 * as a hint only — overpaying isn't blocked (real cash handling sometimes
 * runs over/under), just visible.
 *
 * `defaultValues` is only read by `useForm` on this component's first
 * mount, not on every reopen — the caller must remount this component (e.g.
 * `key={remainingAmount}`) when `remainingAmount` changes between opens, or
 * a second payment's amount field will still default to the stale first
 * value. Same convention as `CustomerFormDialog`'s `key={customer?.id}`.
 */
export function RecordPaymentDialog({
  open,
  onOpenChange,
  orderId,
  customerId,
  remainingAmount,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  customerId: string | null
  remainingAmount: number
}) {
  const recordPayment = useRecordOrderPayment(orderId, customerId)

  const form = useForm<OrderPaymentFormValues>({
    resolver: zodResolver(orderPaymentFormSchema),
    defaultValues: { ...DEFAULT_VALUES, amount: Math.max(remainingAmount, 0) },
  })

  function handleSubmit(values: OrderPaymentFormValues) {
    recordPayment.mutate(
      { orderId, amount: values.amount, paymentMethod: values.paymentMethod, note: values.note },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  const watchedAmount = useWatch({ control: form.control, name: 'amount' })
  const overpaid = watchedAmount > remainingAmount && remainingAmount > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Ghi nhận thanh toán</DialogTitle>
          <DialogDescription>
            Còn lại <strong>{formatCurrencyVND(Math.max(remainingAmount, 0))}</strong> cần thu cho
            đơn hàng này.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
            <IntegerField
              control={form.control}
              name="amount"
              label="Số tiền"
              disabled={recordPayment.isPending}
              autoFocus
              description={overpaid ? `Số tiền vượt quá số còn lại (${formatCurrencyVND(remainingAmount)}).` : undefined}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phương thức</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={recordPayment.isPending}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.entries(PAYMENT_METHOD_LABEL) as [OrderPaymentFormValues['paymentMethod'], string][]).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Không bắt buộc" rows={2} disabled={recordPayment.isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={recordPayment.isPending}
          >
            Hủy
          </Button>
          <Button type="submit" form={FORM_ID} disabled={recordPayment.isPending}>
            {recordPayment.isPending ? 'Đang lưu...' : 'Ghi nhận thanh toán'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
