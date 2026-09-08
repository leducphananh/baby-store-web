import { Clock, HelpCircle, PackageX, TrendingDown } from 'lucide-react'

import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import { ROUTES } from '@/routes/route-paths'
import { buildCountFingerprint } from '@/features/alerts/utils/alert-fingerprint'
import type { AlertType, OperationalAlert } from '@/features/alerts/types/alert'
import type { InventoryAlertCondition, InventoryAlertType } from '@/features/reports/types/inventory'
import type {
  ExpiryAlertCondition,
  ExpiryAlertType,
  ExpiryHorizonDays,
  SalesLookbackDays,
  SlowMovingSummary,
} from '@/features/reports/types/expiry'

/** The Expiry Report's "Hàng ít luân chuyển" section — no route/hash anchor existed before Phase 8.5; see `expiry-report-page.tsx`'s `#slow-moving` scroll-into-view effect (the exact same pattern Product Detail already uses for `#batches`). */
const SLOW_MOVING_HREF = `${ROUTES.expiryReport}#slow-moving`

/**
 * Looks up one alert type's current occurrence row out of an entity-set
 * condition RPC's result (`get_inventory_alert_conditions()` or
 * `get_expiry_alert_conditions()`) — never assumes array order, since
 * neither RPC's row order is a contract.
 */
function findCondition<TType extends string, TCondition extends { alertType: TType }>(
  conditions: TCondition[] | undefined,
  alertType: TType,
): TCondition | undefined {
  return conditions?.find((condition) => condition.alertType === alertType)
}

/**
 * Up to 3 affected product names as a short Vietnamese preview
 * (requirement §79, optional) — never the full affected list (that's what
 * the Inventory Report deep link is for), and never a re-derivation of the
 * fingerprint (which is entity-*id*-based, not name-based).
 */
function describeAffectedProducts(condition: InventoryAlertCondition): string | undefined {
  if (condition.sampleProductNames.length === 0) return undefined
  const suffix = condition.affectedCount > condition.sampleProductNames.length ? '...' : ''
  return `Ví dụ: ${condition.sampleProductNames.join(', ')}${suffix}`
}

/**
 * Expiry alert description (Phase 8.3, requirement §29/§31/§32): the
 * count sentence is always present; up to 3 affected batches are appended
 * as a short preview when available (requirement §40) — `samplePreviews`
 * is already-formatted "product — Lô X" text from the RPC, never
 * re-derived or a fabricated batch number (requirement §41). No inventory
 * VALUE here (`get_expiry_alert_conditions()` doesn't compute one,
 * deliberately, to stay lightweight — requirement §30/§81).
 */
function describeExpiryCondition(condition: ExpiryAlertCondition, countSentence: string): string {
  if (condition.samplePreviews.length === 0) return countSentence
  const suffix = condition.affectedCount > condition.samplePreviews.length ? '...' : ''
  return `${countSentence} Ví dụ: ${condition.samplePreviews.join(', ')}${suffix}`
}

/**
 * One fixed priority model (Phase 8.5, requirement §6/§7): severity first
 * (critical → warning → info — never alphabetical, never a computed
 * business-risk score), then this stable per-type order as the tiebreak.
 * By construction every type's severity already agrees with its position
 * here (both criticals first, then all three warnings, then both infos),
 * so the two keys never disagree — this table exists for a deterministic
 * order WITHIN a severity band, not to override it.
 */
const TYPE_PRIORITY: Record<AlertType, number> = {
  inventory_expired: 0,
  inventory_out_of_stock: 1,
  inventory_missing_expiry: 2,
  inventory_expiring_soon: 3,
  inventory_low_stock: 4,
  inventory_never_sold: 5,
  inventory_no_recent_sale: 6,
}

const SEVERITY_RANK: Record<OperationalAlert['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

/** Severity first, then the fixed type order above — applied once, here, so every consumer (Bell/Dashboard/Alert Center) sees the same order without re-sorting itself. */
function sortByPriority(alerts: OperationalAlert[]): OperationalAlert[] {
  return [...alerts].sort((a, b) => {
    const severityDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    if (severityDiff !== 0) return severityDiff
    return TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]
  })
}

/**
 * THE single place that turns authoritative Phase 7.5/7.6 business facts
 * into `OperationalAlert[]` (requirement §3/§13/§44) — the Executive
 * Dashboard's Attention section, the header Bell/popover, and the Alert
 * Center all call this same function rather than each re-deriving alert
 * conditions themselves. No inventory/expiry/slow-moving math happens
 * here — every count/fingerprint is read verbatim off the conditions
 * already computed by `get_inventory_alert_conditions()` (out_of_stock/
 * low_stock, Phase 8.2 — grouped from `product_inventory_overview.stock_status`,
 * Phase 7.5's authoritative classification) and `get_expiry_alert_conditions()`
 * (expired/expiring_soon/missing_expiry, Phase 8.3 — predicates copied
 * verbatim from `get_expiry_summary()`/`get_expiry_batch_list()`, Phase
 * 7.6's authoritative classification); `slowMoving` still comes from
 * `get_slow_moving_summary()` (out of this phase's scope, untouched).
 *
 * Every alert's `action` (Phase 8.5, requirement §13/§14/§69/§70) points
 * at an EXISTING safe workflow — a filtered report, or the Imports list —
 * never a mutation callback. This is the one and only place those
 * labels/hrefs are defined; no UI component re-derives them by switching
 * on `alert.type` (requirement §70).
 *
 * Alerts are returned pre-sorted by `sortByPriority()` (requirement §6/§7)
 * so no consumer needs to re-sort.
 *
 * This is a pure function (no hooks, no I/O) precisely so it can be
 * reused verbatim by every consumer and unit-reasoned-about independent
 * of how each one fetches its data.
 */
export function buildOperationalAlerts({
  inventoryConditions,
  expiryConditions,
  slowMoving,
  horizonDays,
  lookbackDays,
}: {
  inventoryConditions: InventoryAlertCondition[] | undefined
  expiryConditions: ExpiryAlertCondition[] | undefined
  slowMoving?: SlowMovingSummary | undefined
  horizonDays: ExpiryHorizonDays
  lookbackDays?: SalesLookbackDays
}): OperationalAlert[] {
  const alerts: OperationalAlert[] = []

  const expiredCondition = findCondition<ExpiryAlertType, ExpiryAlertCondition>(expiryConditions, 'inventory_expired')
  if (expiredCondition && expiredCondition.affectedCount > 0) {
    const href = `${ROUTES.expiryReport}?expiryStatus=expired`
    alerts.push({
      key: 'inventory_expired',
      type: 'inventory_expired',
      severity: 'critical',
      icon: PackageX,
      title: 'Hàng đã hết hạn',
      description: describeExpiryCondition(
        expiredCondition,
        `${formatNumber(expiredCondition.affectedCount)} lô hàng còn tồn đã hết hạn.`,
      ),
      href,
      // Deliberately never a one-click "write off everything" action
      // (requirement §17/§18/§65): an aggregate alert can represent many
      // batches, so the CTA always lands on the filtered batch list —
      // the actual write-off is a per-batch decision made there (Phase
      // 8.4's "Hủy hàng"), never bulk-triggered from the alert itself.
      action: { label: 'Xử lý hàng hết hạn', href },
      fingerprint: expiredCondition.fingerprint,
    })
  }

  const outOfStockCondition = findCondition<InventoryAlertType, InventoryAlertCondition>(
    inventoryConditions,
    'inventory_out_of_stock',
  )
  if (outOfStockCondition && outOfStockCondition.affectedCount > 0) {
    alerts.push({
      key: 'inventory_out_of_stock',
      type: 'inventory_out_of_stock',
      severity: 'critical',
      icon: PackageX,
      title: `${formatNumber(outOfStockCondition.affectedCount)} sản phẩm đã hết hàng`,
      description: describeAffectedProducts(outOfStockCondition),
      href: ROUTES.imports,
      // Normal resolution is purchasing/import, never manual stock
      // adjustment (requirement §21/§63/§107) — Phase 8.4's adjustment
      // tool exists for corrections/write-offs, not replenishment. No
      // dedicated "create import" route/dialog-deep-link exists (audited:
      // `ImportReceiptFormDialog` opens from local state on `/imports`,
      // not a URL param) — landing on the list, one click from "Tạo
      // phiếu nhập", is the honest, un-brittle target (requirement §62).
      action: { label: 'Nhập thêm hàng', href: ROUTES.imports },
      secondaryAction: {
        label: 'Xem sản phẩm hết hàng',
        href: `${ROUTES.inventoryReport}?stockStatus=out_of_stock`,
      },
      fingerprint: outOfStockCondition.fingerprint,
    })
  }

  const missingExpiryCondition = findCondition<ExpiryAlertType, ExpiryAlertCondition>(
    expiryConditions,
    'inventory_missing_expiry',
  )
  if (missingExpiryCondition && missingExpiryCondition.affectedCount > 0) {
    const href = `${ROUTES.expiryReport}?expiryStatus=missing_expiry`
    alerts.push({
      key: 'inventory_missing_expiry',
      type: 'inventory_missing_expiry',
      severity: 'warning',
      icon: HelpCircle,
      title: 'Chưa có hạn sử dụng',
      description: describeExpiryCondition(
        missingExpiryCondition,
        `${formatNumber(missingExpiryCondition.affectedCount)} lô hàng còn tồn chưa có thông tin hạn sử dụng.`,
      ),
      href,
      // Known limitation (requirement §20/§74, audited during Phase 8.4):
      // there is no post-confirmation edit path for `expiration_date` —
      // `update_import_receipt_item()` only works while a receipt is
      // still `draft`. This CTA can only ever point at "go inspect the
      // affected batches", never a fix-it-here flow; it does not pretend
      // otherwise (requirement §66 — no delete/write-off shortcut just
      // because metadata is missing).
      action: { label: 'Xem lô chưa có HSD', href },
      fingerprint: missingExpiryCondition.fingerprint,
    })
  }

  const expiringSoonCondition = findCondition<ExpiryAlertType, ExpiryAlertCondition>(
    expiryConditions,
    'inventory_expiring_soon',
  )
  if (expiringSoonCondition && expiringSoonCondition.affectedCount > 0) {
    // `horizon` deep-links the Expiry Report to the same operational
    // default this alert used (requirement §38) — the report's horizon
    // selector is otherwise independent/user-chosen, so a viewer opening
    // this alert sees the same batches the alert counted, not whatever
    // horizon the report happened to be left on last.
    const href = `${ROUTES.expiryReport}?expiryStatus=near_expiry&horizon=${horizonDays}`
    alerts.push({
      key: 'inventory_expiring_soon',
      type: 'inventory_expiring_soon',
      severity: 'warning',
      icon: Clock,
      title: 'Sắp hết hạn',
      description: describeExpiryCondition(
        expiringSoonCondition,
        `${formatNumber(expiringSoonCondition.affectedCount)} lô hàng sẽ hết hạn trong ${horizonDays} ngày tới.`,
      ),
      href,
      // No disposal suggestion (requirement §19/§55): near-expiry stock
      // is still normally sellable, so this only ever says "go look",
      // never "go write off".
      action: { label: 'Xem lô sắp hết hạn', href },
      fingerprint: expiringSoonCondition.fingerprint,
    })
  }

  const lowStockCondition = findCondition<InventoryAlertType, InventoryAlertCondition>(
    inventoryConditions,
    'inventory_low_stock',
  )
  if (lowStockCondition && lowStockCondition.affectedCount > 0) {
    alerts.push({
      key: 'inventory_low_stock',
      type: 'inventory_low_stock',
      severity: 'warning',
      icon: TrendingDown,
      title: `${formatNumber(lowStockCondition.affectedCount)} sản phẩm sắp hết hàng`,
      description: describeAffectedProducts(lowStockCondition),
      href: ROUTES.imports,
      // Same reasoning as out-of-stock (requirement §22/§64): purchasing,
      // not manual adjustment, is the normal way this resolves.
      action: { label: 'Nhập thêm hàng', href: ROUTES.imports },
      secondaryAction: {
        label: 'Xem sản phẩm sắp hết',
        href: `${ROUTES.inventoryReport}?stockStatus=low_stock`,
      },
      fingerprint: lowStockCondition.fingerprint,
    })
  }

  if (slowMoving && (slowMoving.neverSoldCount ?? 0) > 0) {
    alerts.push({
      key: 'inventory_never_sold',
      type: 'inventory_never_sold',
      severity: 'info',
      icon: HelpCircle,
      title: `${formatNumber(slowMoving.neverSoldCount)} sản phẩm còn tồn chưa từng bán`,
      description: `Giá trị tồn: ${formatCurrencyVND(slowMoving.neverSoldValue)}`,
      href: SLOW_MOVING_HREF,
      // Decision-support only (requirement §25/§27/§67) — the "never
      // sold"/"no recent sale" classification itself lives in the Expiry
      // Report's slow-moving section (`get_slow_moving_summary()`), so
      // that is the one honest, correct link target — not Product
      // Performance, which has no "never sold" filter/highlight of its
      // own to land on.
      action: { label: 'Xem hàng chưa từng bán', href: SLOW_MOVING_HREF },
      fingerprint: buildCountFingerprint(slowMoving.neverSoldCount, slowMoving.neverSoldValue),
    })
  }

  if (slowMoving && (slowMoving.noSaleInLookbackCount ?? 0) > 0) {
    alerts.push({
      key: 'inventory_no_recent_sale',
      type: 'inventory_no_recent_sale',
      severity: 'info',
      icon: Clock,
      title: `${formatNumber(slowMoving.noSaleInLookbackCount)} sản phẩm không phát sinh bán trong ${lookbackDays} ngày`,
      href: SLOW_MOVING_HREF,
      action: { label: 'Xem hàng chậm bán', href: SLOW_MOVING_HREF },
      // Phase 9.8 (Debt D): fold the aggregate inventory value into the
      // fingerprint too, matching `inventory_never_sold` above — a "<count>"
      // fingerprint alone can't tell {A,B} from {A,C} at the same count, so
      // a changed slow-moving set could stay marked "read". `count:value`
      // still changes whenever the set change shifts the total inventory
      // value. A true entity-set (sorted product-id) fingerprint is DEFERRED
      // to Phase 10: it needs `get_slow_moving_summary()` to also return the
      // id list, an RPC-shape change disproportionate for two info-severity
      // alerts right before the testing phase (audit §30 tradeoff).
      fingerprint: buildCountFingerprint(
        slowMoving.noSaleInLookbackCount,
        slowMoving.noSaleInLookbackValue,
      ),
    })
  }

  return sortByPriority(alerts)
}
