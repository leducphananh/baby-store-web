/**
 * Thrown when an edit/cancel targets an order that is no longer
 * `draft`/`confirmed` (someone completed or cancelled it in another session
 * between load and save). Lets the UI show a clear "not editable" message
 * instead of a silent no-op — same convention as
 * `ImportReceiptNotEditableError`.
 */
export class OrderNotEditableError extends Error {
  constructor(message = 'Đơn hàng không còn ở trạng thái có thể chỉnh sửa.') {
    super(message)
    this.name = 'OrderNotEditableError'
  }
}
