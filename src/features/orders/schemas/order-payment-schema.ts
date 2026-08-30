import { z } from 'zod'

/**
 * Payment methods come straight from `order_payments.payment_method`'s CHECK
 * constraint (`cash`/`bank_transfer`/`other`) — do not add a value here that
 * isn't in the database constraint (CLAUDE.md §5: "use real database status
 * values in code").
 */
export const orderPaymentFormSchema = z.object({
  amount: z.number().int('Số tiền phải là số nguyên').positive('Số tiền phải lớn hơn 0'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'other']),
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự'),
})

export type OrderPaymentFormValues = z.infer<typeof orderPaymentFormSchema>
