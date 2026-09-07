import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertSeverityBadge } from '@/features/alerts/components/alert-severity-badge'
import type { AlertSeverity, OperationalAlert } from '@/features/alerts/types/alert'

/** Three objective tones mapped from `AlertSeverity` — the one place that mapping lives (requirement §63/§82: no arbitrary per-alert colors). */
const SEVERITY_TONE: Record<AlertSeverity, string> = {
  critical: 'text-destructive',
  warning: 'text-warning',
  info: 'text-muted-foreground',
}

/**
 * One alert row — shared by the Dashboard's Attention section, the header
 * Bell's popover, and the Alert Center (requirement §64/§81).
 *
 * Two variants (Phase 8.5, requirement §15/§16/§52):
 *
 * - `'compact'` (default, used by the Bell and Dashboard Attention) — the
 *   ENTIRE row is one `<Link>` to `alert.href`; unchanged from Phase 8.1
 *   so those two surfaces stay exactly as compact as before (requirement
 *   §56/§72). `onOpen` (if given) fires alongside navigation to mark the
 *   alert read — it never blocks or replaces it (requirement §32/§33).
 * - `'detailed'` (Alert Center only) — shows the severity and read/unread
 *   state as explicit text badges (never color alone, requirement §106),
 *   the full description, and the alert's `action`/`secondaryAction` as
 *   real buttons. The row itself is a plain container, not a wrapping
 *   anchor, specifically so two independently-focusable links can live
 *   inside it without a nested-interactive-control violation (requirement
 *   §52/§53).
 *
 * `isRead` is optional and intentionally so: the Dashboard passes nothing,
 * rendering every row identically regardless of read state (requirement
 * §43 — a read problem is still a problem there). The Bell/Alert Center
 * pass a real boolean.
 */
export function AlertListItem({
  alert,
  isRead,
  onOpen,
  variant = 'compact',
}: {
  alert: OperationalAlert
  isRead?: boolean
  onOpen?: () => void
  variant?: 'compact' | 'detailed'
}) {
  const Icon = alert.icon

  if (variant === 'detailed') {
    return (
      <div className="rounded-lg border p-3">
        <div className="flex items-start gap-3">
          <Icon className={cn('mt-0.5 size-5 shrink-0', SEVERITY_TONE[alert.severity])} aria-hidden="true" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{alert.title}</p>
              <AlertSeverityBadge severity={alert.severity} />
              {isRead !== undefined && (
                <Badge variant={isRead ? 'secondary' : 'default'}>{isRead ? 'Đã đọc' : 'Chưa đọc'}</Badge>
              )}
            </div>
            {alert.description && <p className="text-sm text-muted-foreground">{alert.description}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" onClick={onOpen}>
                <Link to={alert.action.href}>{alert.action.label}</Link>
              </Button>
              {alert.secondaryAction && (
                <Button asChild size="sm" variant="outline" onClick={onOpen}>
                  <Link to={alert.secondaryAction.href}>{alert.secondaryAction.label}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

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
