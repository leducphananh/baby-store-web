/**
 * Builds the coarse `"<count>"` / `"<count>:<value>"` recurrence
 * fingerprint used by Phase 8.1's aggregate alerts — see
 * `OperationalAlert.fingerprint`'s doc comment for exactly what this can
 * and cannot distinguish, and why that's an acceptable, documented
 * limitation for this phase rather than entity-level hashing.
 */
export function buildCountFingerprint(count: number, value?: number): string {
  return value === undefined ? String(count) : `${count}:${value}`
}
