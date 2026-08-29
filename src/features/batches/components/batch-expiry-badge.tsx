import { AlertTriangle, Clock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { classifyExpiry } from '@/features/batches/utils/expiry'

/**
 * The one place a batch's expiry state becomes a badge. State is carried by
 * icon + text, never colour alone (`accessibility` — status not conveyed by
 * colour only).
 *
 * Renders nothing for a batch that is safe or has no expiry date: a table of
 * mostly-fine stock stays readable, and only the rows that need attention
 * (expired, expiring soon) draw the eye. Callers that want the raw state use
 * `classifyExpiry` directly.
 */
export function BatchExpiryBadge({
  expirationDate,
  className,
}: {
  expirationDate: string | null | undefined
  className?: string
}) {
  const status = classifyExpiry(expirationDate)

  switch (status.kind) {
    case 'expired':
      return (
        <Badge variant="destructive" className={className}>
          <AlertTriangle />
          Hết hạn {status.daysAgo} ngày
        </Badge>
      )
    case 'expiring-soon':
      return (
        <Badge variant="warning" className={className}>
          <Clock />
          {status.daysRemaining === 0
            ? 'Hết hạn hôm nay'
            : `Sắp hết hạn · còn ${status.daysRemaining} ngày`}
        </Badge>
      )
    case 'safe':
    case 'none':
      return null
  }
}
