/**
 * Domain model for `public.profiles`, derived from the generated `Tables`
 * type rather than hand-duplicated (see `supabase-database`). `role` is
 * narrowed from the DB's plain `text` (CHECK-constrained to these two
 * values, not a real Postgres enum) to a real union at the service
 * boundary — see `get-profile.ts`.
 */
export type ProfileRole = 'owner' | 'staff'

export type Profile = {
  id: string
  fullName: string | null
  role: ProfileRole | null
}
