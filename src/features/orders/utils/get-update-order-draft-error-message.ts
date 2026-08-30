import { getPostgrestErrorMessage } from '@/features/orders/utils/get-error-message'

/**
 * Map an `update_order_draft` RPC failure to a Vietnamese, user-safe message
 * — same substring-matching convention as `get-create-order-error-message.ts`.
 * No "insufficient stock" case here: editing a draft never posts to
 * inventory (that only happens once, at creation/completion), so the only
 * failure surface is validation + the "no longer editable" status guard.
 */
export function getUpdateOrderDraftErrorMessage(error: unknown): string {
  const message = getPostgrestErrorMessage(error)

  if (message.includes('Order not found')) {
    return 'Đơn hàng không tồn tại.'
  }
  if (message.includes('no longer editable')) {
    return 'Đơn hàng không còn ở trạng thái nháp nên không thể chỉnh sửa.'
  }
  if (message.includes('at least one item')) {
    return 'Đơn hàng phải có ít nhất một sản phẩm.'
  }
  if (message.includes('Customer not found')) {
    return 'Khách hàng không tồn tại. Vui lòng chọn lại.'
  }
  if (message.includes('missing a product')) {
    return 'Có dòng hàng chưa chọn sản phẩm hợp lệ.'
  }
  if (message.includes('quantity must be')) {
    return 'Số lượng sản phẩm không hợp lệ.'
  }
  if (message.includes('price must be')) {
    return 'Đơn giá sản phẩm không hợp lệ.'
  }
  if (message.includes('archived and cannot be sold')) {
    return 'Một sản phẩm trong đơn đã ngừng kinh doanh, không thể bán.'
  }
  if (message.includes('Product not found')) {
    return 'Một sản phẩm trong đơn không còn tồn tại.'
  }
  return 'Không thể lưu thay đổi. Vui lòng thử lại.'
}
