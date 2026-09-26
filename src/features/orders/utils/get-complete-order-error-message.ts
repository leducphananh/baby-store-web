export function getCompleteOrderErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)
  if (msg.includes('Order must be draft or confirmed to complete')) {
    return 'Đơn hàng không ở trạng thái nháp nên không thể hoàn thành.'
  }
  if (msg.includes('Insufficient non-expired stock')) {
    return 'Không đủ tồn kho hợp lệ (chưa hết hạn) để hoàn thành đơn hàng này.'
  }
  return 'Không thể hoàn thành đơn hàng. Vui lòng thử lại.'
}
