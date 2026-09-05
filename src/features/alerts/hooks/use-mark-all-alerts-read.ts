import { useMutation, useQueryClient } from '@tanstack/react-query'

import { markAllAlertsRead } from '@/features/alerts/api/mark-all-alerts-read'
import { alertsKeys } from '@/features/alerts/api/query-keys'
import type { AlertReadState } from '@/features/alerts/types/alert'

/**
 * "Đánh dấu tất cả đã đọc" — only ever called with the caller's CURRENT
 * list of visible alerts (requirement §32), so this can never suppress an
 * alert type that doesn't exist yet. A later new/re-occurring alert has
 * its own fresh fingerprint and is unread again regardless of what this
 * call marked read today.
 */
export function useMarkAllAlertsRead(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alerts: { alertKey: string; fingerprint: string }[]) => {
      if (!userId) return Promise.reject(new Error('Không xác định được người dùng hiện tại.'))
      return markAllAlertsRead({ userId, alerts })
    },
    onMutate: async (alerts) => {
      if (!userId) return undefined
      const queryKey = alertsKeys.readStates(userId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<AlertReadState[]>(queryKey)
      const now = new Date().toISOString()

      queryClient.setQueryData<AlertReadState[]>(queryKey, (current = []) => {
        const untouched = current.filter((state) => !alerts.some((alert) => alert.alertKey === state.alertKey))
        return [...untouched, ...alerts.map((alert) => ({ ...alert, readAt: now }))]
      })

      return { previous, queryKey }
    },
    onError: (_error, _alerts, context) => {
      if (context?.queryKey) queryClient.setQueryData(context.queryKey, context.previous)
    },
    onSettled: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: alertsKeys.readStates(userId) })
    },
  })
}
