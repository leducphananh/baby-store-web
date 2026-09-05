import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { AlertSeverity, OperationalAlert } from '@/features/alerts/types/alert'

/** Three objective tones mapped from `AlertSeverity` — the one place that mapping lives (requirement §63/§82: no arbitrary per-alert colors). */
const SEVERITY_TONE: Record<AlertSeverity, string> = {
  critical: 'text-destructive',
  warning: 'text-warning',
  info: 'text-muted-foreground',
}

/**
 * One alert row — shared by the Dashboard's Attention section, the header
 * Bell's popover, and the Alert Center (requirement §64/§81). Always just
 * navigation (requirement §35/§75); `onOpen` (if given) fires alongside
 * the navigation to mark the alert read — it never blocks or replaces it.
 *
 * `isRead` is optional and intentionally so: the Dashboard passes nothing,
 * rendering every row identically regardless of read state (requirement
 * §43 — a read problem is still a problem there). The Bell/Alert Center
 * pass a real boolean and get the small unread dot.
 */
export function AlertListItem({
  alert,
  isRead,
  onOpen,
}: {
  alert: OperationalAlert
  isRead?: boolean
  onOpen?: () => void
}) {
  const Icon = alert.icon

  return (
    <Link
      to={alert.href}
      onClick={onOpen}
      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
    >
      <Icon className={cn('size-5 shrink-0', SEVERITY_TONE[alert.severity])} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isRead === false && (
            <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Chưa đọc" role="status" />
          )}
          <p className="font-medium text-foreground">{alert.title}</p>
        </div>
        {alert.description && <p className="text-sm text-muted-foreground">{alert.description}</p>}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}
