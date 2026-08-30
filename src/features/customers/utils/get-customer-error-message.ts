import type { CustomerFormValues } from '@/features/customers/schemas/customer-schema'

type CustomerMutationAction = 'create' | 'update' | 'delete'

type PostgrestLike = { code?: unknown; message?: unknown; details?: unknown }

function asPostgrestLike(error: unknown): PostgrestLike {
  return typeof error === 'object' && error !== null ? (error as PostgrestLike) : {}
}

function getCode(error: unknown): string | undefined {
  const code = asPostgrestLike(error).code
  return typeof code === 'string' ? code : undefined
}

function getText(error: unknown): string {
  const { message, details } = asPostgrestLike(error)
  return `${typeof message === 'string' ? message : ''} ${typeof details === 'string' ? details : ''}`.toLowerCase()
}

/**
 * When a unique-constraint violation (`23505`) is attributable to a
 * specific field, return that field so the form can show the error inline
 * next to the input (see `react-hook-form-zod` rule 7) instead of only a
 * toast. `customers` has a UNIQUE constraint on `phone` only.
 */
export function getCustomerUniqueField(error: unknown): keyof CustomerFormValues | null {
  if (getCode(error) !== '23505') return null
  return getText(error).includes('phone') ? 'phone' : null
}

/**
 * Map a customer mutation failure to a Vietnamese, user-safe message (see
 * `error-handling`) — never the raw Postgres/PostgREST string.
 *
 * - `23503` on delete: `orders.customer_id` still references this customer
 *   (`ON DELETE RESTRICT`) — an expected domain outcome, not a bug: order
 *   history is never silently destroyed (CLAUDE.md §11). Points at the
 *   schema-supported alternative (archiving via `status`) instead of just
 *   saying "no".
 * - `23505`: duplicate phone number.
 */
export function getCustomerErrorMessage(error: unknown, action: CustomerMutationAction): string {
  const code = getCode(error)

  if (action === 'delete' && code === '23503') {
    return 'Không thể xóa khách hàng này vì đã có đơn hàng liên quan. Hãy chuyển trạng thái sang "Ngừng hoạt động" thay vì xóa để giữ lại lịch sử đơn hàng.'
  }

  if (code === '23505') {
    return 'Số điện thoại này đã được dùng cho một khách hàng khác.'
  }

  switch (action) {
    case 'create':
      return 'Không thể tạo khách hàng. Vui lòng thử lại.'
    case 'update':
      return 'Không thể cập nhật khách hàng. Vui lòng thử lại.'
    case 'delete':
      return 'Không thể xóa khách hàng. Vui lòng thử lại.'
  }
}
