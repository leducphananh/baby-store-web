import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import type { Profile, ProfileRole } from '@/features/auth/types/profile'

type ProfileRow = Tables<'profiles'>

function isProfileRole(value: string | null): value is ProfileRole {
  return value === 'owner' || value === 'staff'
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    role: isProfileRole(row.role) ? row.role : null,
  }
}

/**
 * Fetch the current user's own profile row, scoped to `auth.uid()` via the
 * `.eq('id', userId)` filter.
 *
 * SELECT on `profiles` is intentionally readable by any signed-in user
 * (`profiles_select`, `USING (true)`) — this single-store admin app
 * resolves OTHER users' `full_name` for display all over the place (who
 * confirmed an import, who adjusted a batch, who created an order), which
 * needs exactly this. What Phase 2 flagged and Phase 9.1's security audit
 * fixed is UPDATE: it used to be equally unrestricted (any signed-in user
 * could edit ANY OTHER user's profile row, including `role`); it is now
 * `profiles_update_self`, restricted to `id = auth.uid()` — see that
 * migration's comment for the residual, explicitly-accepted limitation
 * (a user can still edit their OWN `role`, which has no functional
 * authorization consequence anywhere in this app today).
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data ? toProfile(data) : null
}
