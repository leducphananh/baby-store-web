/**
 * Map an add/update/delete-item RPC failure to a Vietnamese, user-safe
 * message (see `error-handling`). The RPCs (`add_import_receipt_item` etc.)
 * raise plain `RAISE EXCEPTION` text — matched here rather than a
 * Postgres error `code`, since a generic `RAISE EXCEPTION` always surfaces
 * as `P0001` regardless of which check failed.
 */
export function getImportReceiptLineErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : ''

  if (message.includes('draft status')) {
    return 'Phiếu nhập không còn ở trạng thái nháp nên không thể chỉnh sửa hàng hóa.'
  }
  if (message.includes('Quantity must be')) {
    return 'Số lượng phải lớn hơn 0.'
  }
  if (message.includes('Purchase price must be')) {
    return 'Đơn giá không được âm.'
  }
  if (
    message.includes('Expiration date must be') ||
    message.includes('expiry_after_manufacture')
  ) {
    return 'Hạn sử dụng không được trước ngày sản xuất.'
  }
  if (message.includes('not found')) {
    return 'Không tìm thấy dữ liệu. Vui lòng tải lại trang.'
  }
  return 'Không thể lưu dòng hàng. Vui lòng thử lại.'
}
