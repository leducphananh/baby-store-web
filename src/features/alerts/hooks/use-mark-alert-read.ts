import { useMutation, useQueryClient } from '@tanstack/react-query'

import { markAlertRead } from '@/features/alerts/api/mark-alert-read'
import { alertsKeys } from '@/features/alerts/api/query-keys'
import type { AlertReadState } from '@/features/alerts/types/alert'

/**
 * Marks one alert read — optimistic (requirement §80: read/unread is a
 * good, low-risk candidate for it), with a rollback to the previous cache
 * snapshot on failure and a final `invalidateQueries` to reconcile with
 * the server regardless of outcome. Never refetches unrelated Reports
 * data — only this user's own read-state query.
 */
export function useMarkAlertRead(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { alertKey: string; fingerprint: string }) => {
      if (!userId) return Promise.reject(new Error('Không xác định được người dùng hiện tại.'))
      return markAlertRead({ userId, alertKey: input.alertKey, fingerprint: input.fingerprint })
    },
    onMutate: async (input) => {
      if (!userId) return undefined
      const queryKey = alertsKeys.readStates(userId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<AlertReadState[]>(queryKey)

      queryClient.setQueryData<AlertReadState[]>(queryKey, (current = []) => [
        ...current.filter((state) => state.alertKey !== input.alertKey),
        { alertKey: input.alertKey, fingerprint: input.fingerprint, readAt: new Date().toISOString() },
      ])

      return { previous, queryKey }
    },
    onError: (_error, _input, context) => {
      if (context?.queryKey) queryClient.setQueryData(context.queryKey, context.previous)
    },
    onSettled: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: alertsKeys.readStates(userId) })
    },
  })
}
