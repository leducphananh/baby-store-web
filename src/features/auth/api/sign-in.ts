import { supabase } from '@/lib/supabase'
import type { LoginFormValues } from '@/features/auth/schemas/login-schema'

/**
 * Sign in with Supabase Auth's built-in email/password flow — no custom
 * password handling of any kind (see CLAUDE.md security rules). On success,
 * `supabase.auth.onAuthStateChange` (wired in `AuthProvider`) picks up the
 * new session; this function does not set any app state itself.
 */
export async function signInWithPassword({ email, password }: LoginFormValues) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}
