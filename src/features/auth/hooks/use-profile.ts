import { useQuery } from '@tanstack/react-query'

import { getProfile } from '@/features/auth/api/get-profile'
import { authKeys } from '@/features/auth/api/query-keys'

/**
 * The authenticated user's `profiles` row. Disabled until a user id is
 * known (see `react-query` — query params/enabled gating). Profile data
 * rarely changes within a session, so `staleTime` is generous.
 */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: authKeys.profile(userId ?? ''),
    // Safe: `enabled` guarantees queryFn only runs once userId is truthy;
    // TanStack Query can't express that dependency in queryFn's own types.
    queryFn: () => getProfile(userId as string),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  })
}
