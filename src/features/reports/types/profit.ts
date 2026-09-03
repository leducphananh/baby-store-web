/**
 * Profit Report domain types (Phase 7.3). Mirrors `get_profit_summary()`/
 * `get_profit_timeseries()` exactly — both RPCs already enforce "completed
 * orders only, business date = completed_at" server-side and compute COGS
 * strictly from the historical `order_item_batches.unit_cost` snapshot (see
 * their migration comments); nothing here re-derives, re-filters, or
 * recomputes that rule.
 *
 * This is Gross Profit (Revenue - COGS), never Net Profit — no operating
 * expenses/salaries/rent/tax are deducted anywhere in this feature
 * (requirement §53).
 */
export type ProfitSummary = {
  /** Integer VND — `SUM(orders.total)` for completed orders in range. Must equal Revenue Report's `totalRevenue` for the same range. */
  totalRevenue: number
  completedOrderCount: number
  /** Integer VND — `SUM(order_item_batches.quantity * unit_cost)`, the historical cost snapshot from `complete_order()`. Never derived from current product/batch purchase price. */
  totalCogs: number
  /** Integer VND — `totalRevenue - totalCogs`. Can be negative (a loss-making period) — never clamped to 0. */
  grossProfit: number
  /**
   * Count of completed orders in range whose sold quantity isn't fully
   * covered by `order_item_batches` allocation rows — a defense-in-depth
   * data-quality signal, not an expected condition (`complete_order()`
   * guarantees full allocation atomically; see the RPC's migration
   * comment). Always 0 for data written through the normal app flow.
   */
  ordersWithMissingCost: number
}

/** One Vietnam-local calendar day's revenue/COGS/gross-profit — zero-filled for days with no completed orders. */
export type ProfitDailyPoint = {
  /** Plain `YYYY-MM-DD`, Vietnam-local calendar date. */
  reportDate: string
  orderCount: number
  /** Integer VND. */
  revenue: number
  /** Integer VND. */
  cogs: number
  /** Integer VND — `revenue - cogs`, can be negative. */
  grossProfit: number
}
