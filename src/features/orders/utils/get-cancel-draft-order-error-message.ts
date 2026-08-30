import { OrderNotEditableError } from '@/features/orders/api/order-errors'

/**
 * Map a `cancelDraftOrder` failure to a Vietnamese, user-safe message — same
 * "special-case the not-editable error" convention as
 * `get-import-receipt-error-message.ts`.
 */
export function getCancelDraftOrderErrorMessage(error: unknown): string {
  if (error instanceof OrderNotEditableError) {
    return error.message
  }
  return 'Không thể hủy đơn hàng. Vui lòng thử lại.'
}
