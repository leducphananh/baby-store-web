import { Navigate, Outlet, useLocation } from 'react-router'

import { FullPageLoading } from '@/components/common/full-page-loading'
import { useAuth } from '@/providers/auth-provider'
import { ROUTES } from '@/routes/route-paths'

/**
 * Layout-route guard for every authenticated page (see `react-router`,
 * `supabase-auth`). This is UX protection only — the real authorization
 * boundary is Postgres RLS (see CLAUDE.md §9). Carries the attempted
 * location as router state so `PublicOnlyRoute` can send the user back to
 * where they were headed after a successful login.
 */
function RequireAuth() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return <FullPageLoading />
  }

  if (auth.status === 'unauthenticated') {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />
  }

  return <Outlet />
}

export { RequireAuth }
