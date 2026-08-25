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
 * Note: the `profiles` table's current RLS policy (`profiles_all`, `USING
 * (true)` for the `authenticated` role) does not itself restrict reads to
 * the caller's own row — it allows any signed-in user to read any profile.
 * This query still filters client-side to the caller's own id, but that is
 * NOT a substitute for row-level authorization (see CLAUDE.md §9 /
 * `supabase-auth`) — flagged in the Phase 2 completion report as a
 * pre-existing backend condition to review, not something this frontend
 * change silently "fixes".
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
