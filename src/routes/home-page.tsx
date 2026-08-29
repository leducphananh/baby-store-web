import { PackageSearch } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'

/**
 * Temporary placeholder home page for Phase 1 (project foundation).
 *
 * This intentionally does not implement any business feature yet — no
 * categories/products/orders/dashboard widgets — per phase discipline
 * (CLAUDE.md §14). It exists to give the app shell, routing, and Tailwind/
 * shadcn setup something real to render, and demonstrates the shared
 * `PageHeader` / `PageContent` / `EmptyState` conventions that feature
 * pages will build on.
 */
function HomePage() {
  return (
    <PageContent>
      <PageHeader
        title="Baby Wale"
        description="Nền tảng ứng dụng đã sẵn sàng. Các module nghiệp vụ sẽ được triển khai ở các giai đoạn tiếp theo."
      />
      <EmptyState
        icon={PackageSearch}
        title="Chưa có module nào được kích hoạt"
        description="Danh mục, sản phẩm, đơn hàng và các báo cáo sẽ xuất hiện tại đây khi được triển khai."
      />
    </PageContent>
  )
}

export { HomePage }
