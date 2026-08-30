/**
 * Map a `confirm_import_receipt` RPC failure to a Vietnamese, user-safe
 * message (see `error-handling`). Same convention as
 * `get-import-receipt-line-error-message.ts`: the RPC raises plain
 * `RAISE EXCEPTION` text, which always surfaces as Postgres code `P0001`
 * regardless of which check failed — so specific business errors are
 * matched by substring here, not by code.
 */
export function getConfirmImportReceiptErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : ''

  if (message.includes('Receipt not found')) {
    return 'Phiếu nhập không tồn tại.'
  }
  if (message.includes('already confirmed')) {
    return 'Phiếu nhập đã được xác nhận trước đó.'
  }
  if (message.includes('cancelled and cannot')) {
    return 'Phiếu nhập đã bị hủy nên không thể xác nhận.'
  }
  if (message.includes('must be in draft status')) {
    return 'Phiếu nhập không còn ở trạng thái nháp nên không thể xác nhận.'
  }
  if (message.includes('no items to confirm')) {
    return 'Phiếu nhập chưa có sản phẩm nào. Vui lòng thêm hàng hóa trước khi xác nhận.'
  }
  if (message.includes('missing a product')) {
    return 'Có dòng hàng chưa gán sản phẩm hợp lệ. Vui lòng kiểm tra lại phiếu.'
  }
  if (message.includes('quantity must be')) {
    return 'Số lượng nhập không hợp lệ.'
  }
  if (message.includes('purchase price must be')) {
    return 'Đơn giá nhập không hợp lệ.'
  }
  return 'Không thể xác nhận phiếu nhập. Vui lòng thử lại.'
}
