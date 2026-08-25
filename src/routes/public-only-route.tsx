import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { FullPageLoading } from '@/components/common/full-page-loading'
import { useAuth } from '@/providers/auth-provider'
import { ROUTES } from '@/routes/route-paths'

/**
 * Narrow, validated read of the `{ from: Location }` state `RequireAuth`
 * attaches when it redirects to `/login` — avoids an unchecked cast on
 * `location.state`, which react-router types as `unknown`.
 */
function getRedirectPath(state: unknown): string {
  if (state && typeof state === 'object' && 'from' in state) {
    const from = (state as { from?: { pathname?: unknown } }).from
    if (from && typeof from.pathname === 'string') {
      return from.pathname
    }
  }
  return ROUTES.home
}

/**
 * Guards `/login` itself: while the initial session check is still
 * running, show the same full-page loading state as `RequireAuth` (never
 * flash the login form to an already-authenticated user). Once resolved,
 * an authenticated user is bounced to wherever they originally tried to
 * go (or home); only an unauthenticated user actually sees the form.
 */
function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return <FullPageLoading />
  }

  if (auth.status === 'authenticated') {
    return <Navigate to={getRedirectPath(location.state)} replace />
  }

  return children
}

export { PublicOnlyRoute }
