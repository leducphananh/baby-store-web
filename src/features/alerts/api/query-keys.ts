/**
 * Query key factory for the Alert Foundation's own interaction-state data
 * (requirement §77) — deliberately separate from `reportsKeys`: business
 * report queries are reused directly via their own existing keys
 * (`reportsKeys.inventorySummary()`, etc.), never re-namespaced under
 * `alertsKeys`. This factory only ever covers `alert_read_states` reads/
 * writes, keyed by user id so one signed-in user's cache can never bleed
 * into another's within the same browser (e.g. after a sign-out/sign-in
 * as a different staff member).
 */
export const alertsKeys = {
  all: ['alerts'] as const,
  readStates: (userId: string) => [...alertsKeys.all, 'read-states', userId] as const,
}
