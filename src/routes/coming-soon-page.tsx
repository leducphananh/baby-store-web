import { Construction } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'

/**
 * Shared placeholder for sidebar destinations that don't have a real
 * feature implementation yet (see CLAUDE.md §14, phase discipline). One
 * component parametrized by title, reused by every nav route in
 * `src/app/router.tsx` — not one file per module.
 */
function ComingSoonPage({ title }: { title: string }) {
  return (
    <PageContent>
      <PageHeader title={title} />
      <EmptyState
        icon={Construction}
        title="Tính năng đang được phát triển"
        description={`Module "${title}" sẽ sớm được triển khai ở giai đoạn tiếp theo.`}
      />
    </PageContent>
  )
}

export { ComingSoonPage }
