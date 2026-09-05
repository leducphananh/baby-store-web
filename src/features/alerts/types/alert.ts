import type { LucideIcon } from 'lucide-react'

/**
 * Alert Foundation domain model (Phase 8.1). An `OperationalAlert` is a
 * derived, presentation-ready fact — never a stored business record (see
 * `build-operational-alerts.ts`'s doc comment for why). Phase 8.1 only
 * populates the `inventory_*` types below by reusing Phase 7.5/7.6
 * authoritative summaries; the union stays open for Phase 8.2/8.3 to add
 * to without touching this file's consumers (Bell/Alert
 * Center/Dashboard all switch on `AlertSeverity`, never on `AlertType`
 * itself, so adding a type never requires a new UI branch).
 */
export type AlertType =
  | 'inventory_out_of_stock'
  | 'inventory_low_stock'
  | 'inventory_expired'
  | 'inventory_expiring_soon'
  | 'inventory_missing_expiry'
  | 'inventory_never_sold'
  | 'inventory_no_recent_sale'

/**
 * Three objective levels, not a graded score (requirement §7/§8): a
 * mapping FROM an alert's fixed type, never computed from a formula like
 * `stock × expiry × revenue`. `critical` reads as `--destructive` in the
 * design system, `warning` as `--warning`, `info` as muted — see
 * `alert-list-item.tsx`.
 */
export type AlertSeverity = 'info' | 'warning' | 'critical'

/**
 * One current operational condition. Phase 8.1 treats every alert as
 * AGGREGATE-level (requirement §10) — one `OperationalAlert` per `type`,
 * e.g. "84 sản phẩm đã hết hàng", never one row per affected product. This
 * is also the alert's deterministic identity (requirement §9): `key`
 * equals `type` today because at most one instance of each type can ever
 * exist; if a future phase introduces entity-level alerts (e.g. one alert
 * per near-expiry batch), `key` would extend to `` `${type}:${entityId}` ``
 * without changing anything that only reads `key`.
 */
export type OperationalAlert = {
  key: AlertType
  type: AlertType
  severity: AlertSeverity
  icon: LucideIcon
  /** Vietnamese, store-operator-facing — never a DB column/RPC name. */
  title: string
  description?: string
  /** An existing route (`ROUTES.*`) — alerts only navigate, never mutate (requirement §35/§75/§39). */
  href: string
  /**
   * Recurrence fingerprint (requirement §20/§21) — changes whenever the
   * underlying occurrence meaningfully changes, so a stored "read" against
   * an old fingerprint is simply stale and the alert becomes unread again
   * with no cleanup job (see `alert_read_states` migration comment).
   *
   * `inventory_out_of_stock`/`inventory_low_stock` (Phase 8.2) use a richer
   * fingerprint built from `get_inventory_alert_conditions()`:
   * `` `${occurrenceVersion}:${sortedAffectedProductIds.join(',')}` `` — see
   * that RPC's migration comment. This detects BOTH a changed affected-
   * product set at the same count (the id list differs) AND a condition
   * that fully resolved and later reoccurred with the exact same product
   * set (`occurrenceVersion` incremented by the store-wide
   * `alert_condition_states` lifecycle table on the inactive→active
   * transition) — both cases Phase 8.1's coarse fingerprint could not
   * distinguish.
   *
   * The other five alert types (`inventory_expired`, `inventory_expiring_soon`,
   * `inventory_missing_expiry`, `inventory_never_sold`,
   * `inventory_no_recent_sale`) still use Phase 8.1's coarser `"<count>"` /
   * `"<count>:<value>"` fingerprint (`buildCountFingerprint`) — out of scope
   * for Phase 8.2, deferred to a future phase once those alerts have their
   * own entity-set/lifecycle treatment.
   */
  fingerprint: string
}

/** One row of `alert_read_states`, mapped to camelCase — interaction state only, never a business count/value (requirement §26). */
export type AlertReadState = {
  alertKey: string
  fingerprint: string
  readAt: string
}
