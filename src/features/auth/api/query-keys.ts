/**
 * Query key factory for the auth feature (see `react-query`). Session state
 * itself is NOT a query — it comes from `AuthProvider` — only the
 * `profiles` row is genuine server data fetched through TanStack Query.
 */
export const authKeys = {
  all: ['auth'] as const,
  profile: (userId: string) => [...authKeys.all, 'profile', userId] as const,
}
