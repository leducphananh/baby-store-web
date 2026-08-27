function getPostgrestCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

/**
 * Map a supplier mutation failure to a Vietnamese, user-safe message (see
 * `error-handling`). `23503` on delete means `import_receipts.supplier_id`
 * still references this supplier (`ON DELETE RESTRICT`) — an expected
 * domain outcome, not a bug: purchasing history is never silently
 * destroyed (see CLAUDE.md §17/§32, `domain-driven-frontend`). The message
 * points at the schema-supported alternative (archiving via the status
 * field) instead of just saying "no".
 */
export function getSupplierErrorMessage(error: unknown, action: 'create' | 'update' | 'delete'): string {
  if (action === 'delete' && getPostgrestCode(error) === '23503') {
    return 'Không thể xóa nhà cung cấp này vì đã có phiếu nhập hàng liên quan. Hãy chuyển trạng thái sang "Ngừng hợp tác" thay vì xóa để giữ lại lịch sử nhập hàng.'
  }

  switch (action) {
    case 'create':
      return 'Không thể tạo nhà cung cấp. Vui lòng thử lại.'
    case 'update':
      return 'Không thể cập nhật nhà cung cấp. Vui lòng thử lại.'
    case 'delete':
      return 'Không thể xóa nhà cung cấp. Vui lòng thử lại.'
  }
}
