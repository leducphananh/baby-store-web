import { useQuery } from '@tanstack/react-query'

import { getAlertReadStates } from '@/features/alerts/api/get-alert-read-states'
import { alertsKeys } from '@/features/alerts/api/query-keys'

/**
 * The current user's alert interaction state. Disabled until a user id is
 * known (same `enabled` gating convention as `useProfile`) — alerts only
 * ever exist inside the authenticated app (requirement §70).
 */
export function useAlertReadStates(userId: string | undefined) {
  return useQuery({
    queryKey: alertsKeys.readStates(userId ?? ''),
    queryFn: () => getAlertReadStates(userId as string),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  })
}
