import { supabase } from '@/lib/supabase'

export type MarkAlertReadInput = {
  userId: string
  alertKey: string
  fingerprint: string
}

/**
 * Marks one alert occurrence read for the current user — an upsert on the
 * `(user_id, alert_key)` unique constraint, never an insert-only history
 * row (see `alert_read_states`' migration comment: one row per alert key,
 * overwritten on every read). Storing `fingerprint` alongside `read_at` is
 * what lets a later, different occurrence of the same `alertKey` become
 * unread again with no separate cleanup step (requirement §20/§60).
 */
export async function markAlertRead(input: MarkAlertReadInput): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await supabase.from('alert_read_states').upsert(
    {
      user_id: input.userId,
      alert_key: input.alertKey,
      fingerprint: input.fingerprint,
      read_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id,alert_key' },
  )
  if (error) throw error
}
