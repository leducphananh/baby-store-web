import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast with a clear message instead of letting every downstream
  // Supabase call fail with a cryptic "Invalid URL" error.
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env.local ' +
      'and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}

/**
 * Single shared Supabase client instance for the whole app.
 *
 * Only the anon/publishable key is ever used here — never the service role
 * key (see `.env.example` and CLAUDE.md §9). Real authorization is enforced
 * by Postgres RLS policies on the database, not by anything in this file.
 *
 * Components must never import this directly — go through a feature's
 * `api/` service functions instead (see `supabase-react` skill).
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
