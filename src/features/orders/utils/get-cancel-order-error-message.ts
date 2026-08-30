import { getPostgrestErrorMessage } from '@/features/orders/utils/get-error-message'

/** Map a `cancel_order` RPC failure to a Vietnamese, user-safe message. */
export function getCancelOrderErrorMessage(error: unknown): string {
  const message = getPostgrestErrorMessage(error)

  if (message.includes('Order not found')) {
    return 'Đơn hàng không tồn tại.'
  }
  if (message.includes('Only completed orders can be cancelled')) {
    return 'Chỉ đơn hàng đã hoàn tất mới có thể hủy theo cách này.'
  }
  return 'Không thể hủy đơn hàng. Vui lòng thử lại.'
}
