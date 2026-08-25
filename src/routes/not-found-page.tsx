import { FileQuestion } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { ROUTES } from '@/routes/route-paths'

/**
 * Catch-all 404 route — distinct from a query's "not found" empty state
 * (which appears inside a page for a specific missing record); this is for
 * an unmatched URL entirely (see `error-handling`).
 */
function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={FileQuestion}
        title="Không tìm thấy trang"
        description="Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi."
        action={
          <Button asChild size="sm">
            <Link to={ROUTES.home}>Về trang chủ</Link>
          </Button>
        }
      />
    </div>
  )
}

export { NotFoundPage }
