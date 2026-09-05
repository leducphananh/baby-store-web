/**
 * Expiry & Slow-moving Report domain types (Phase 7.6). Two deliberately
 * separate concepts (requirement §2):
 *
 * - Expiry Risk: batch/date-based, CURRENT remaining inventory only
 *   (`remaining_quantity > 0`), Vietnam-business-date arithmetic.
 * - Slow-moving analysis: product/sales-velocity-based, FACTUAL metrics
 *   only — this app has no configured "slow-moving" business rule, so
 *   nothing here classifies a product as slow-moving; it only reports
 *   current inventory + recent sales activity and lets the operator judge
 *   (requirement §22/§67/§73).
 *
 * Neither concept uses the shared `ReportDateRangePicker`/`ReportDateRange`
 * — both are current-state snapshots parameterized by a horizon/lookback
 * day count, never a fixed historical [from, to) range (requirement §20).
 */

/** Report filter, not a permanent business threshold (requirement §8) — 30 is only the pre-existing app-wide default already used for this purpose (`EXPIRING_SOON_DAYS`, Phase 4). */
export type ExpiryHorizonDays = 7 | 30 | 60 | 90
/** Sales analysis window for slow-moving metrics — a lookback, not a "slow" threshold (requirement §21/§35). */
export type SalesLookbackDays = 30 | 60 | 90

/** Fixed, transparent buckets covering ALL current remaining inventory (requirement §9/§41) — every batch with stock falls into exactly one. */
export type ExpiryBucketKey =
  | 'expired'
  | 'due_0_7'
  | 'due_8_30'
  | 'due_31_60'
  | 'due_61_90'
  | 'due_over_90'
  | 'missing_expiry'

export type ExpiryBucketRow = {
  bucket: ExpiryBucketKey
  bucketOrder: number
  batchCount: number
  quantity: number
  /** Integer VND — historical batch cost, reconciles exactly with Phase 7.5's total across all 7 buckets. */
  inventoryValue: number
}

/** Horizon-scoped KPIs — expired / near-expiry-within-horizon / missing-expiry, all `remaining_quantity > 0` only. */
export type ExpirySummary = {
  expiredBatchCount: number
  expiredQuantity: number
  expiredInventoryValue: number
  nearExpiryBatchCount: number
  nearExpiryQuantity: number
  nearExpiryInventoryValue: number
  missingExpiryBatchCount: number
  missingExpiryQuantity: number
  missingExpiryValue: number
}

/** `expired = expiration_date < business_today` (not yet expired ON its expiration_date — same convention as `complete_order()`/`classifyExpiry`, requirement §7). */
export type ExpiryStatus = 'expired' | 'near_expiry' | 'missing_expiry'
export type ExpiryStatusFilter = 'all' | ExpiryStatus

export type ExpiryBatchRow = {
  batchId: string
  productId: string
  productName: string
  sku: string
  categoryId: string | null
  categoryName: string | null
  productStatus: 'active' | 'archived'
  lotNumber: string | null
  remainingQuantity: number
  /** Integer VND — this batch's own historical acquisition cost, never current product/supplier price. */
  purchasePrice: number
  /** Integer VND — `remainingQuantity * purchasePrice`. */
  inventoryValue: number
  expirationDate: string | null
  /** `null` when `expirationDate` is null. Negative = days already expired. */
  daysRemaining: number | null
  expiryStatus: ExpiryStatus
}

export type ExpiryBatchSortField = 'expiration_date' | 'inventory_value' | 'remaining_quantity' | 'product_name'

export type ExpiryBatchFilters = {
  horizonDays: ExpiryHorizonDays
  search: string
  categoryId: string | null
  statusFilter: ExpiryStatusFilter
  sortField: ExpiryBatchSortField
  sortDesc: boolean
  page: number
  pageSize: number
}

export type ExpiryBatchPage = {
  data: ExpiryBatchRow[]
  total: number
}

export type SlowMovingSortField =
  | 'name'
  | 'last_sold_at'
  | 'inventory_value'
  | 'current_quantity'
  | 'sold_quantity'
  | 'revenue'
  | 'order_count'
  | 'days_since_last_sale'

export type SlowMovingRow = {
  productId: string
  productName: string
  sku: string
  categoryId: string | null
  categoryName: string | null
  unit: string
  productStatus: 'active' | 'archived'
  currentQuantity: number
  /** Integer VND — same formula as Phase 7.5's Inventory Report, reconciles exactly for this product. */
  inventoryValue: number
  /** `null` = never sold (a completed order containing this product), not a fake distant date (requirement §25). Cancelled orders never count. */
  lastSoldAt: string | null
  /** `null` when `lastSoldAt` is null — never a sentinel like 999999 (requirement §25/§106, not persisted — derived on every query). */
  daysSinceLastSale: number | null
  /** `SUM(order_items.quantity)` for completed orders in the selected lookback, ending now. */
  soldQuantityLookback: number
  orderCountLookback: number
  /** Integer VND — `SUM(order_items.line_total)`, same historical-revenue rule as Phase 7.4. */
  revenueLookback: number
}

export type SlowMovingFilters = {
  lookbackDays: SalesLookbackDays
  search: string
  categoryId: string | null
  sortField: SlowMovingSortField
  sortDesc: boolean
  page: number
  pageSize: number
}

export type SlowMovingPage = {
  data: SlowMovingRow[]
  total: number
}

/** Factual KPIs only — no "slow-moving" classification (requirement §67/§69/§70). */
export type SlowMovingSummary = {
  /** Current stock > 0, no completed sale ever. */
  neverSoldCount: number
  neverSoldValue: number
  /** Current stock > 0, no completed sale within the selected lookback. */
  noSaleInLookbackCount: number
  noSaleInLookbackValue: number
}

/**
 * The three expiry alert types `get_expiry_alert_conditions()` (Phase 8.3)
 * reports on — a subset of `AlertType`, deliberately not the report's own
 * `ExpiryStatus` union (`'expired' | 'near_expiry' | 'missing_expiry'`):
 * these are the Alert Foundation's `AlertType` string literals
 * (`inventory_expired`/`inventory_expiring_soon`/`inventory_missing_expiry`),
 * used as the RPC's own row discriminator and as `alert_condition_states`
 * keys.
 */
export type ExpiryAlertType = 'inventory_expired' | 'inventory_expiring_soon' | 'inventory_missing_expiry'

/**
 * One expiry alert type's current occurrence data (Phase 8.3) — the
 * lightweight, batch-identity-aware replacement for reading
 * `expiredBatchCount`/`nearExpiryBatchCount`/`missingExpiryBatchCount` off
 * `ExpirySummary` for alert purposes. `fingerprint` already encodes both
 * the affected BATCH-id set (`product_batches.id`, never `product_id` —
 * one product can have both an expired batch and a fresh one) and the
 * store-wide occurrence lifecycle (same mechanism as
 * `InventoryAlertCondition.fingerprint`) — never rebuild it client-side.
 * `samplePreviews` is display-only, already-formatted text (product name
 * + lot number where available), truncated to at most 3 — never a batch
 * identifier fabricated client-side.
 */
export type ExpiryAlertCondition = {
  alertType: ExpiryAlertType
  affectedCount: number
  fingerprint: string
  samplePreviews: string[]
}
