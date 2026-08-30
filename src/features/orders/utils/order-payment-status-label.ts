import type { OrderPaymentStatus } from '@/features/orders/types/order'

/**
 * One place the order payment-status → Vietnamese label mapping lives —
 * shared by `PaymentStatusBadge` (adds icon/color) and the PDF export (plain
 * text, no badge component available in `@react-pdf/renderer`'s render tree).
 */
export const ORDER_PAYMENT_STATUS_LABEL: Record<OrderPaymentStatus, string> = {
  unpaid: 'Chưa thanh toán',
  partial: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
}
