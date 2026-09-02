/**
 * Revenue Report domain types (Phase 7.2). Mirrors `get_revenue_summary()`/
 * `get_revenue_timeseries()` exactly — both RPCs already enforce "completed
 * orders only, business date = completed_at" server-side (see their
 * migration comments); nothing here re-derives or re-filters that rule.
 */
export type RevenueSummary = {
  /** Integer VND — `SUM(orders.total)` for completed orders in range. */
  totalRevenue: number
  completedOrderCount: number
  /** Integer VND — `totalRevenue / completedOrderCount`, 0 when there are no orders (never NaN/Infinity). */
  averageOrderValue: number
  /** Integer VND — payments recorded against those same completed orders, regardless of the payment's own date (see the RPC's doc comment: this is a sales-revenue collection status, not a cashflow-by-payment-date figure). */
  paidAmount: number
  /** Integer VND — `totalRevenue - paidAmount`. Can go negative if a period was genuinely overpaid (this app doesn't block overpayment) — never silently clamped to 0. */
  outstandingAmount: number
}

/** One Vietnam-local calendar day's revenue — zero-filled for days with no completed orders. */
export type RevenueDailyPoint = {
  /** Plain `YYYY-MM-DD`, Vietnam-local calendar date. */
  reportDate: string
  orderCount: number
  /** Integer VND. */
  revenue: number
}
