import { supabase } from '@/lib/supabase'
import type { ExpiryAlertCondition, ExpiryAlertType, ExpiryHorizonDays } from '@/features/reports/types/expiry'

/**
 * Current expired/expiring-soon/missing-expiry alert occurrence data
 * (Phase 8.3) — grouped from the exact `get_expiry_summary()`/
 * `get_expiry_batch_list()` predicates (Phase 7.6 authoritative
 * semantics, copied verbatim server-side, never re-derived here or in
 * SQL). Replaces `getExpirySummary()` as the header Bell/Alert Center/
 * Dashboard-Attention's source for these three alert types: lighter (no
 * per-batch value computation) and carries a fingerprint that already
 * reflects the affected batch-id set and occurrence lifecycle.
 *
 * `horizonDays` should always be the app's one fixed operational default
 * (`ALERT_EXPIRY_HORIZON_DAYS`), never the Expiry Report's user-selectable
 * analysis horizon — see `use-operational-alerts.ts`.
 */
export async function getExpiryAlertConditions(horizonDays: ExpiryHorizonDays): Promise<ExpiryAlertCondition[]> {
  const { data, error } = await supabase.rpc('get_expiry_alert_conditions', { p_horizon_days: horizonDays })
  if (error) throw error

  return (data ?? []).map((row) => ({
    alertType: row.alert_type as ExpiryAlertType,
    affectedCount: row.affected_count ?? 0,
    fingerprint: row.fingerprint,
    samplePreviews: row.sample_previews ?? [],
  }))
}
