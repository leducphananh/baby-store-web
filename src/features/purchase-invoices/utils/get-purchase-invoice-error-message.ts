import { InvoiceFileRejectedError } from '@/features/purchase-invoices/api/purchase-invoice-errors'

type InvoiceAction = 'create' | 'update' | 'delete'
type InvoiceFileAction = 'upload' | 'delete'

type PostgrestLike = { code?: unknown; message?: unknown }

function getCode(error: unknown): string | undefined {
  const code = typeof error === 'object' && error !== null ? (error as PostgrestLike).code : undefined
  return typeof code === 'string' ? code : undefined
}

/**
 * Map a purchase-invoice mutation failure to a Vietnamese, user-safe message
 * — never a raw Postgres/PostgREST string (see `error-handling`).
 *
 * - `23503` on create: `created_by` has no matching `profiles` row, or the
 *   parent import receipt vanished.
 * - `42501` / `PGRST301`: RLS/permission denied — the real authorization
 *   boundary rejected the write (see `frontend-security`).
 */
export function getPurchaseInvoiceErrorMessage(error: unknown, action: InvoiceAction): string {
  const code = getCode(error)

  if (action === 'create' && code === '23503') {
    return 'Không thể tạo hóa đơn: tài khoản của bạn chưa có hồ sơ nhân viên hoặc phiếu nhập không tồn tại.'
  }
  if (code === '42501' || code === 'PGRST301') {
    return 'Bạn không có quyền thực hiện thao tác này.'
  }

  switch (action) {
    case 'create':
      return 'Không thể tạo hóa đơn. Vui lòng thử lại.'
    case 'update':
      return 'Không thể cập nhật hóa đơn. Vui lòng thử lại.'
    case 'delete':
      return 'Không thể xóa hóa đơn. Vui lòng thử lại.'
  }
}

/**
 * Vietnamese, user-safe message for an attachment mutation failure. A
 * rejected file (wrong type / too big — `InvoiceFileRejectedError`, or the
 * bucket's own `allowed_mime_types` / `file_size_limit` rejection) reads
 * differently from an upload that reached the server and failed there (see
 * `file-upload` rule 6).
 */
export function getInvoiceFileErrorMessage(error: unknown, action: InvoiceFileAction): string {
  if (error instanceof InvoiceFileRejectedError) {
    return error.message
  }

  const raw = error instanceof Error ? error.message.toLowerCase() : ''
  if (
    action === 'upload' &&
    (raw.includes('mime') || raw.includes('size') || raw.includes('exceeded'))
  ) {
    return 'Tệp bị từ chối: chỉ nhận PDF, JPG hoặc PNG dưới 10MB.'
  }

  return action === 'upload'
    ? 'Tải tệp lên thất bại. Vui lòng thử lại.'
    : 'Không thể xóa tệp đính kèm. Vui lòng thử lại.'
}
