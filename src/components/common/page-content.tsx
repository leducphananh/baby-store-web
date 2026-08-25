import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Shared page shell: stacks the header, an optional filters row, and the
 * main content section with consistent spacing — the rest of the common
 * page structure described in CLAUDE.md §8, alongside `PageHeader`.
 */
function PageContent({
  filters,
  children,
  className,
}: {
  filters?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      {children}
    </div>
  )
}

export { PageContent }
