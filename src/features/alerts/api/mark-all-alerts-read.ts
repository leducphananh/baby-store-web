import { supabase } from '@/lib/supabase'

export type MarkAllAlertsReadInput = {
  userId: string
  /** Only the alerts currently visible/occurring — "mark all read" can never suppress a future, not-yet-existing occurrence (requirement §32). */
  alerts: { alertKey: string; fingerprint: string }[]
}

/** Upserts read state for every currently-visible alert in one batch call. */
export async function markAllAlertsRead(input: MarkAllAlertsReadInput): Promise<void> {
  if (input.alerts.length === 0) return

  const now = new Date().toISOString()
  const rows = input.alerts.map((alert) => ({
    user_id: input.userId,
    alert_key: alert.alertKey,
    fingerprint: alert.fingerprint,
    read_at: now,
    updated_at: now,
  }))

  const { error } = await supabase.from('alert_read_states').upsert(rows, { onConflict: 'user_id,alert_key' })
  if (error) throw error
}
