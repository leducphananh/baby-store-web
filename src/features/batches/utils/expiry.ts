import { daysBetweenYmd, todayYmd } from '@/utils/date'
import type { BatchExpiryStatus } from '@/features/batches/types/batch'

/**
 * Days before a not-yet-expired batch is treated as "expiring soon".
 *
 * There is currently **no configurable expiry threshold** in the schema —
 * no per-product column, no settings table. This constant is therefore the
 * single, documented default for the whole app. When a configurable
 * threshold is added later (an `alerts` settings row, or a per-product
 * override — see `domain-driven-frontend` rules 19–20), this value becomes
 * the fallback and `classifyExpiry` gains a parameter; no call site that
 * only reads the resulting status needs to change.
 *
 * 30 days ≈ one restock cycle for diapers/formula — enough lead time for
 * staff to discount or pull near-expiry stock.
 */
export const EXPIRING_SOON_DAYS = 30

/**
 * Classify a batch's `expiration_date` relative to `today` (defaults to the
 * viewer's local calendar date). The one place the expired / expiring-soon /
 * safe decision is made — components and queries call this, never compare
 * dates or hardcode the threshold themselves (`domain-driven-frontend`
 * rule 19).
 *
 * A batch with no expiry date is `{ kind: 'none' }` — there's nothing to
 * warn about. "Expires today" counts as expiring-soon with `daysRemaining: 0`.
 */
export function classifyExpiry(
  expirationDate: string | null | undefined,
  today: string = todayYmd(),
): BatchExpiryStatus {
  if (!expirationDate) return { kind: 'none' }

  const diff = daysBetweenYmd(today, expirationDate)
  if (diff < 0) return { kind: 'expired', daysAgo: -diff }
  if (diff <= EXPIRING_SOON_DAYS) return { kind: 'expiring-soon', daysRemaining: diff }
  return { kind: 'safe', daysRemaining: diff }
}

/** Convenience predicates over `classifyExpiry` — for filters and conditionals. */
export function isExpired(expirationDate: string | null | undefined, today?: string): boolean {
  return classifyExpiry(expirationDate, today).kind === 'expired'
}

export function isExpiringSoon(expirationDate: string | null | undefined, today?: string): boolean {
  return classifyExpiry(expirationDate, today).kind === 'expiring-soon'
}

export function isSafe(expirationDate: string | null | undefined, today?: string): boolean {
  return classifyExpiry(expirationDate, today).kind === 'safe'
}
