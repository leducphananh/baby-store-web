import type { OrderItemDraft } from '@/features/orders/schemas/order-form-schema'

/**
 * Map a `create_order` RPC failure to a Vietnamese, user-safe message (see
 * `error-handling`). Same convention as
 * `get-confirm-import-receipt-error-message.ts`: the RPC raises plain
 * `RAISE EXCEPTION` text, which always surfaces as Postgres code `P0001`
 * regardless of which check failed — so specific business errors are
 * matched by substring here, not by code.
 *
 * `items` (the cart at submit time) lets the "insufficient stock" case name
 * the actual product — the RPC's message only carries a product id.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  // supabase-js's `.rpc()` rejects with a plain object matching
  // `PostgrestError`'s shape here (not always an actual `Error` instance —
  // `instanceof Error` alone is not reliable for it), so fall back to
  // reading `.message` structurally.
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return ''
}

export function getCreateOrderErrorMessage(error: unknown, items: OrderItemDraft[]): string {
  const message = getErrorMessage(error)

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
  if (message.includes('Insufficient non-expired stock for product')) {
    const match = /Insufficient non-expired stock for product ([0-9a-f-]{36})/.exec(message)
    const productId = match?.[1]
    const product = items.find((item) => item.productId === productId)
    return product
      ? `Không đủ tồn kho khả dụng cho sản phẩm "${product.productName}". Vui lòng kiểm tra lại số lượng.`
      : 'Không đủ tồn kho khả dụng cho một sản phẩm trong đơn. Vui lòng kiểm tra lại số lượng.'
  }
  return 'Không thể tạo đơn hàng. Vui lòng thử lại.'
}
