import { getPostgrestErrorMessage } from '@/features/orders/utils/get-error-message'

/** Map an `adjust_inventory` RPC failure to a Vietnamese, user-safe message (see `error-handling`). */
export function getAdjustInventoryErrorMessage(error: unknown): string {
  const message = getPostgrestErrorMessage(error)

  if (message.includes('Batch not found')) {
    return 'Không tìm thấy lô hàng. Vui lòng tải lại trang.'
  }
  if (message.includes('Write-off quantity exceeds remaining stock')) {
    // Stale-form case (requirement §62): someone else changed this batch's
    // stock since the dialog opened — never silently retry a destructive
    // mutation against a number that's now wrong.
    return 'Tồn kho của lô đã thay đổi. Vui lòng tải lại và thử lại.'
  }
  if (message.includes('Write-off quantity must be greater than 0')) {
    return 'Số lượng hủy phải lớn hơn 0.'
  }
  if (message.includes('Actual quantity must be zero or greater')) {
    return 'Số lượng thực tế không được nhỏ hơn 0.'
  }
  if (message.includes('No change: actual quantity matches current quantity')) {
    return 'Số lượng thực tế trùng với tồn hiện tại — không có gì để điều chỉnh.'
  }
  if (message.includes('Batch is not expired')) {
    return 'Lô hàng này chưa hết hạn nên không thể chọn lý do "Hàng hết hạn".'
  }
  if (message.includes('Note is required for this adjustment reason')) {
    return 'Vui lòng nhập ghi chú cho lý do này.'
  }
  return 'Không thể điều chỉnh tồn kho. Vui lòng thử lại.'
}
