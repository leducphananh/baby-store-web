import { supabase } from '@/lib/supabase'

/**
 * Sign out via Supabase Auth. `AuthProvider`'s `onAuthStateChange` listener
 * picks up the resulting SIGNED_OUT event; the query cache is cleared by
 * the calling mutation hook (`useSignOut`), not here.
 */
export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
