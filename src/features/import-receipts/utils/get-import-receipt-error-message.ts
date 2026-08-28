import { ImportReceiptNotEditableError } from '@/features/import-receipts/api/import-receipt-errors'
import type { ImportReceiptFormValues } from '@/features/import-receipts/schemas/import-receipt-schema'

type ImportReceiptAction = 'create' | 'update' | 'cancel'

type PostgrestLike = { code?: unknown; message?: unknown; details?: unknown }

function asPostgrestLike(error: unknown): PostgrestLike {
  return typeof error === 'object' && error !== null ? (error as PostgrestLike) : {}
}

function getCode(error: unknown): string | undefined {
  const code = asPostgrestLike(error).code
  return typeof code === 'string' ? code : undefined
}

/** A duplicate `receipt_number` (`23505`) is attributable to that field. */
export function getImportReceiptUniqueField(error: unknown): keyof ImportReceiptFormValues | null {
  return getCode(error) === '23505' ? 'receiptNumber' : null
}

/**
 * Map an import-receipt mutation failure to a Vietnamese, user-safe message
 * — never a raw Postgres/PostgREST string (see `error-handling`).
 *
 * - `ImportReceiptNotEditableError`: the receipt left `draft` — expected,
 *   not a bug.
 * - `23505`: `receipt_number` already used.
 * - `23503` on create: `created_by` has no matching `profiles` row.
 * - `42501` / `PGRST301`: RLS/permission denied — the real authorization
 *   boundary rejected the write (see `frontend-security`).
 */
export function getImportReceiptErrorMessage(error: unknown, action: ImportReceiptAction): string {
  if (error instanceof ImportReceiptNotEditableError) {
    return action === 'cancel'
      ? 'Không thể hủy: phiếu nhập này không còn ở trạng thái nháp.'
      : 'Không thể lưu: phiếu nhập này không còn ở trạng thái nháp và đã trở thành chứng từ kho.'
  }

  const code = getCode(error)

  if (code === '23505') {
    return 'Mã phiếu nhập này đã tồn tại. Vui lòng dùng mã khác.'
  }
  if (action === 'create' && code === '23503') {
    return 'Tài khoản của bạn chưa có hồ sơ nhân viên nên chưa thể tạo phiếu. Vui lòng liên hệ quản trị viên.'
  }
  if (code === '42501' || code === 'PGRST301') {
    return 'Bạn không có quyền thực hiện thao tác này.'
  }

  switch (action) {
    case 'create':
      return 'Không thể tạo phiếu nhập. Vui lòng thử lại.'
    case 'update':
      return 'Không thể cập nhật phiếu nhập. Vui lòng thử lại.'
    case 'cancel':
      return 'Không thể hủy phiếu nhập. Vui lòng thử lại.'
  }
}
