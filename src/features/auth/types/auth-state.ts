import type { Session, User } from '@supabase/supabase-js'

/**
 * Discriminated union for the app's auth session state (see
 * `typescript-strict`). `loading` is the state while the initial
 * `getSession()` call is still in flight — every consumer must handle it
 * explicitly to avoid a flash of the wrong UI (see `RequireAuth`,
 * `PublicOnlyRoute`).
 */
export type AuthState =
  | { status: 'loading'; session: null; user: null }
  | { status: 'authenticated'; session: Session; user: User }
  | { status: 'unauthenticated'; session: null; user: null }
