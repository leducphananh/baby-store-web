import type { ProductFormValues } from '@/features/products/schemas/product-schema'

type ProductMutationAction = 'create' | 'update' | 'delete' | 'status'

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
  return `${typeof message === 'string' ? message : ''} ${typeof details === 'string' ? details : ''}`
}

/**
 * When a unique-constraint violation (`23505`) is attributable to a specific
 * field, return that field so the form can show the error inline next to the
 * input (see `react-hook-form-zod` rule 7) instead of only a toast.
 * `products` has UNIQUE constraints on `sku` and `barcode`.
 */
export function getProductUniqueField(error: unknown): keyof ProductFormValues | null {
  if (getCode(error) !== '23505') return null
  const text = getText(error).toLowerCase()
  if (text.includes('barcode')) return 'barcode'
  if (text.includes('sku')) return 'sku'
  return null
}

/**
 * Map a product mutation failure to a Vietnamese, user-safe message — never
 * the raw Postgres/PostgREST string (see `error-handling`).
 *
 * - `23503` on delete: the product still has orders / imports / batches /
 *   inventory transactions (`ON DELETE RESTRICT`). Expected — point at
 *   archiving instead.
 * - `23505`: duplicate SKU or barcode.
 */
export function getProductErrorMessage(error: unknown, action: ProductMutationAction): string {
  const code = getCode(error)

  if (action === 'delete' && code === '23503') {
    return 'Không thể xóa sản phẩm này vì đã có dữ liệu liên quan (đơn hàng, phiếu nhập, lô hàng hoặc giao dịch kho). Hãy chuyển trạng thái sang "Ngừng kinh doanh" để giữ lại lịch sử thay vì xóa.'
  }

  if (code === '23505') {
    const field = getProductUniqueField(error)
    if (field === 'barcode') return 'Mã vạch này đã được dùng cho một sản phẩm khác.'
    return 'Mã SKU này đã được dùng cho một sản phẩm khác.'
  }

  switch (action) {
    case 'create':
      return 'Không thể tạo sản phẩm. Vui lòng thử lại.'
    case 'update':
      return 'Không thể cập nhật sản phẩm. Vui lòng thử lại.'
    case 'delete':
      return 'Không thể xóa sản phẩm. Vui lòng thử lại.'
    case 'status':
      return 'Không thể cập nhật trạng thái sản phẩm. Vui lòng thử lại.'
  }
}
