import { getPostgrestErrorMessage } from '@/features/orders/utils/get-error-message'

/** Map a `record_order_payment` RPC failure to a Vietnamese, user-safe message. */
export function getRecordOrderPaymentErrorMessage(error: unknown): string {
  const message = getPostgrestErrorMessage(error)

  if (message.includes('Order not found')) {
    return 'Đơn hàng không tồn tại.'
  }
  if (message.includes('Only completed orders can receive payments')) {
    return 'Chỉ có thể ghi nhận thanh toán cho đơn hàng đã hoàn tất.'
  }
  if (message.includes('amount must be greater than 0')) {
    return 'Số tiền thanh toán phải lớn hơn 0.'
  }
  if (message.includes('Invalid payment method')) {
    return 'Phương thức thanh toán không hợp lệ.'
  }
  return 'Không thể ghi nhận thanh toán. Vui lòng thử lại.'
}
