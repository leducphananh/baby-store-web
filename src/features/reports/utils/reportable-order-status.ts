import type { OrderStatus } from '@/features/orders/types/order'

/**
 * The single definition of which order statuses count toward financial
 * reporting — mirrors `public.reportable_orders`' own predicate
 * (`status = 'completed'`) exactly (see that view's migration/comment).
 * `draft`/`confirmed` have no finalized total and no posted inventory
 * deduction yet; `cancelled` keeps whatever `total` it had at the moment it
 * was completed (`cancel_order()` never zeroes it out) — a real trap for a
 * naive `status != 'draft'` check. Only `completed` is a real, posted sale.
 *
 * All actual report aggregation happens in the database (through
 * `reportable_orders` or a future RPC built on it), never by fetching raw
 * orders and filtering in the browser (`dashboard-ui` skill rule 7a) — this
 * exists so the rule has exactly one authoritative definition on the
 * TypeScript side too, for anywhere reporting code needs to reason about
 * order status client-side, instead of scattering `status === 'completed'`
 * checks.
 */
export const REPORTABLE_ORDER_STATUSES: readonly OrderStatus[] = ['completed']

export function isReportableOrderStatus(status: OrderStatus): boolean {
  return REPORTABLE_ORDER_STATUSES.includes(status)
}
