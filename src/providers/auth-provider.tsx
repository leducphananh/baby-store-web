import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { supabase } from '@/lib/supabase'
import type { AuthState } from '@/features/auth/types/auth-state'

const AuthContext = createContext<AuthState | null>(null)

/**
 * Owns the app's auth session state, sourced entirely from Supabase Auth's
 * own session management (`getSession` for the initial load,
 * `onAuthStateChange` for everything after — sign in, sign out, token
 * refresh) — no session persistence is re-implemented here (see
 * `supabase-auth`).
 *
 * This is the one legitimate use of `useEffect` in this file: subscribing
 * to a real external system, not fetching/deriving data (see
 * `react-typescript`).
 */
function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', session: null, user: null })

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      setState(
        session
          ? { status: 'authenticated', session, user: session.user }
          : { status: 'unauthenticated', session: null, user: null },
      )
    })

    // Fires for SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, and
    // the initial session on load — one listener covers every case in the
    // task list (initial session, session changes, signed in/out, token
    // refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setState(
        session
          ? { status: 'authenticated', session, user: session.user }
          : { status: 'unauthenticated', session: null, user: null },
      )
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

/**
 * Read the current auth state. Every consumer must handle `status ===
 * 'loading'` explicitly (see `RequireAuth`, `PublicOnlyRoute`) rather than
 * assuming a session is either present or absent.
 */
function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }
  return context
}

export { AuthProvider, useAuth }
