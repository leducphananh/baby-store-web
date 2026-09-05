import { useMemo } from 'react'

import { useAuth } from '@/providers/auth-provider'
import { useAlertReadStates } from '@/features/alerts/hooks/use-alert-read-states'
import { useMarkAlertRead } from '@/features/alerts/hooks/use-mark-alert-read'
import { useMarkAllAlertsRead } from '@/features/alerts/hooks/use-mark-all-alerts-read'
import { useOperationalAlerts } from '@/features/alerts/hooks/use-operational-alerts'
import type { OperationalAlert } from '@/features/alerts/types/alert'

export type AlertWithReadState = {
  alert: OperationalAlert
  isRead: boolean
}

/**
 * The one composition hook every read-state-aware alert surface (header
 * Bell/popover, Alert Center) builds on — combines the current business
 * conditions (`useOperationalAlerts`) with this user's own interaction
 * state (`useAlertReadStates`) by comparing each alert's live
 * `fingerprint` against the stored one for its `key` (requirement §20/§21:
 * a mismatched fingerprint means the occurrence changed since it was last
 * read, so it's unread again — no separate "resolved" bookkeeping needed).
 *
 * Read state failing to load never hides the business conditions
 * themselves (requirement §68/§69) — every alert simply renders as unread
 * until the read-state query succeeds.
 *
 * `read ≠ resolved`: an alert disappears from the returned list only when
 * `useOperationalAlerts` itself stops producing it (the underlying
 * condition is gone) — this hook never filters by read state.
 */
export function useAlertsWithReadState({ includeSlowMoving }: { includeSlowMoving: boolean }) {
  const auth = useAuth()
  const userId = auth.user?.id

  const { alerts, isLoading, isError, refetch } = useOperationalAlerts({ includeSlowMoving })
  const readStatesQuery = useAlertReadStates(userId)
  const markAlertRead = useMarkAlertRead(userId)
  const markAllAlertsRead = useMarkAllAlertsRead(userId)

  const alertsWithReadState = useMemo<AlertWithReadState[]>(() => {
    const readByKey = new Map((readStatesQuery.data ?? []).map((state) => [state.alertKey, state.fingerprint]))
    return alerts.map((alert) => ({
      alert,
      isRead: readByKey.get(alert.key) === alert.fingerprint,
    }))
  }, [alerts, readStatesQuery.data])

  const unreadCount = alertsWithReadState.filter((item) => !item.isRead).length

  function markRead(alert: OperationalAlert) {
    markAlertRead.mutate({ alertKey: alert.key, fingerprint: alert.fingerprint })
  }

  function markAllRead() {
    const unread = alertsWithReadState.filter((item) => !item.isRead).map((item) => item.alert)
    if (unread.length === 0) return
    markAllAlertsRead.mutate(unread.map((alert) => ({ alertKey: alert.key, fingerprint: alert.fingerprint })))
  }

  return {
    alerts: alertsWithReadState,
    unreadCount,
    isLoading,
    isError,
    refetch,
    markRead,
    markAllRead,
  }
}
