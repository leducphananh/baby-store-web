import type { OrderPaymentMethod } from '@/features/orders/types/order-detail'

/**
 * One place the payment-method → Vietnamese label mapping lives (payment
 * history table + the record-payment form's method picker) — values match
 * `order_payments.payment_method`'s CHECK constraint exactly (CLAUDE.md §5:
 * never invent a status/enum value the schema doesn't have).
 */
export const PAYMENT_METHOD_LABEL: Record<OrderPaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  other: 'Khác',
}
