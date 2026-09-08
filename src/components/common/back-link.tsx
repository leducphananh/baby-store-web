import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * The one back-navigation control for detail / edit / nested pages — a muted
 * "‹ <label>" link, placed above the `PageHeader` (see CLAUDE.md §8, the
 * `responsive-design` skill). Every detail and report route rendered its own
 * byte-identical copy of this before Phase 9.4; this consolidates them so
 * the pattern can only look and behave one way.
 */
export function BackLink({
  to,
  label,
  className,
}: {
  to: string
  label: string
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  )
}
