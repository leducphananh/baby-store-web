import { AlertOctagon, AlertTriangle, Info } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import type { AlertSeverity } from '@/features/alerts/types/alert'

/** Same pattern as `StockStatusBadge`/`ExpiryStatusBadge` — state carried by icon + text, never color alone (`accessibility`). */
const CONFIG: Record<AlertSeverity, { label: string; variant: 'destructive' | 'warning' | 'info'; Icon: typeof Info }> = {
  critical: { label: 'Nghiêm trọng', variant: 'destructive', Icon: AlertOctagon },
  warning: { label: 'Cảnh báo', variant: 'warning', Icon: AlertTriangle },
  info: { label: 'Thông tin', variant: 'info', Icon: Info },
}

/**
 * The one place an alert's severity becomes a badge (Phase 8.5) — used by
 * the Alert Center's detailed item and its severity-summary chips; never
 * re-derived per component. `children` (optional) appends a count after
 * the label — e.g. `<AlertSeverityBadge severity="critical">2</AlertSeverityBadge>`
 * → "Nghiêm trọng · 2" for the summary row, while the plain per-item badge
 * (no children) just reads "Nghiêm trọng".
 */
export function AlertSeverityBadge({
  severity,
  className,
  children,
}: {
  severity: AlertSeverity
  className?: string
  children?: ReactNode
}) {
  const { label, variant, Icon } = CONFIG[severity]
  return (
    <Badge variant={variant} className={className}>
      <Icon />
      {label}
      {children !== undefined && <span>· {children}</span>}
    </Badge>
  )
}
