import { Link } from 'react-router'
import { ChevronRight, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type AttentionSeverity = 'destructive' | 'warning' | 'info'

const SEVERITY_TONE: Record<AttentionSeverity, string> = {
  destructive: 'text-destructive',
  warning: 'text-warning',
  info: 'text-muted-foreground',
}

/**
 * One row in the "Cần chú ý" section — a factual observation (title +
 * optional detail) linking to the report that explains it, never an
 * action performed from the dashboard itself (requirement §35/§75: this
 * only navigates, it never confirms an import, completes/cancels an
 * order, or adjusts inventory). Severity is one of three objective tones
 * (destructive/warning/info) driven by what kind of fact it is — never a
 * weighted score (requirement §24/§82).
 */
export function AttentionItem({
  icon: Icon,
  severity,
  title,
  description,
  href,
}: {
  icon: LucideIcon
  severity: AttentionSeverity
  title: string
  description?: string
  href: string
}) {
  return (
    <Link
      to={href}
      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
    >
      <Icon className={cn('size-5 shrink-0', SEVERITY_TONE[severity])} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}
