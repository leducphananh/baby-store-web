import { AlertListItem } from '@/features/alerts/components/alert-list-item'
import type { AlertWithReadState } from '@/features/alerts/hooks/use-alerts-with-read-state'
import type { OperationalAlert } from '@/features/alerts/types/alert'

/**
 * Renders a list of alerts with read state — used by both the Bell
 * popover (top few) and the Alert Center (full, filtered list). Purely
 * presentational: the caller decides what subset of alerts to pass in and
 * what "no items" should say (requirement §37/§92, different empty
 * messages for "no alerts at all" vs. "no unread alerts").
 */
export function AlertList({
  items,
  onOpen,
  emptyMessage,
}: {
  items: AlertWithReadState[]
  onOpen: (alert: OperationalAlert) => void
  emptyMessage: string
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="space-y-2">
      {items.map(({ alert, isRead }) => (
        <AlertListItem key={alert.key} alert={alert} isRead={isRead} onOpen={() => onOpen(alert)} />
      ))}
    </div>
  )
}
