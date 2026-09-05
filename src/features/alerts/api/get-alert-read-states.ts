import { supabase } from '@/lib/supabase'
import type { AlertReadState } from '@/features/alerts/types/alert'

/**
 * The current user's own alert interaction state. RLS
 * (`user_id = auth.uid()`) already guarantees this can only ever return
 * rows owned by the caller — the explicit `.eq('user_id', userId)` filter
 * here is defense-in-depth/index-friendliness, not the actual security
 * boundary (CLAUDE.md §9).
 */
export async function getAlertReadStates(userId: string): Promise<AlertReadState[]> {
  const { data, error } = await supabase
    .from('alert_read_states')
    .select('alert_key, fingerprint, read_at')
    .eq('user_id', userId)

  if (error) throw error

  return (data ?? []).map((row) => ({
    alertKey: row.alert_key,
    fingerprint: row.fingerprint,
    readAt: row.read_at,
  }))
}
