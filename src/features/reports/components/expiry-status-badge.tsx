import { AlertTriangle, Clock, HelpCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { ExpiryStatus } from '@/features/reports/types/expiry'

/**
 * Objective expiry-status label for one batch row (requirement §37/§81) —
 * state carried by icon + text, never colour alone. Deliberately its own
 * component, not `BatchExpiryBadge` (`features/batches`): that one
 * classifies against the viewer's browser-local date and a hardcoded
 * 30-day window, whereas this renders the server-computed, Vietnam-
 * business-date-correct `expiryStatus`/`daysRemaining` this report's own
 * RPC already decided — two different authorities would risk disagreeing
 * on-screen.
 */
export function ExpiryStatusBadge({
  status,
  daysRemaining,
}: {
  status: ExpiryStatus
  daysRemaining: number | null
}) {
  if (status === 'missing_expiry') {
    return (
      <Badge variant="secondary">
        <HelpCircle />
        Chưa có HSD
      </Badge>
    )
  }

  if (status === 'expired') {
    return (
      <Badge variant="destructive">
        <AlertTriangle />
        Đã hết hạn{daysRemaining !== null ? ` ${Math.abs(daysRemaining)} ngày` : ''}
      </Badge>
    )
  }

  // near_expiry
  return (
    <Badge variant="warning">
      <Clock />
      {daysRemaining === 0 ? 'Hết hạn hôm nay' : `Còn ${daysRemaining} ngày`}
    </Badge>
  )
}
