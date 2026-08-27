function getPostgrestCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

/**
 * Map a category mutation failure to a Vietnamese, user-safe message —
 * never the raw Postgres/PostgREST error (see `error-handling`).
 *
 * `23503` (foreign_key_violation) on delete is an expected domain error:
 * `products.category_id` references `categories` with `ON DELETE
 * RESTRICT`, so deleting a category that still has products fails at the
 * database level by design (see CLAUDE.md §32 delete rules /
 * `domain-driven-frontend`) — this is not a bug to hide, it's the correct
 * outcome, just needs a message that names the actual reason.
 */
export function getCategoryErrorMessage(error: unknown, action: 'create' | 'update' | 'delete'): string {
  if (action === 'delete' && getPostgrestCode(error) === '23503') {
    return 'Không thể xóa danh mục này vì vẫn còn sản phẩm thuộc danh mục. Vui lòng chuyển hoặc xóa các sản phẩm liên quan trước.'
  }

  switch (action) {
    case 'create':
      return 'Không thể tạo danh mục. Vui lòng thử lại.'
    case 'update':
      return 'Không thể cập nhật danh mục. Vui lòng thử lại.'
    case 'delete':
      return 'Không thể xóa danh mục. Vui lòng thử lại.'
  }
}
