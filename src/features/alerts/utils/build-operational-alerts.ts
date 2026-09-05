import { Clock, HelpCircle, PackageX, TrendingDown } from 'lucide-react'

import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import { ROUTES } from '@/routes/route-paths'
import { buildCountFingerprint } from '@/features/alerts/utils/alert-fingerprint'
import type { OperationalAlert } from '@/features/alerts/types/alert'
import type { InventoryAlertCondition, InventoryAlertType } from '@/features/reports/types/inventory'
import type {
  ExpiryAlertCondition,
  ExpiryAlertType,
  ExpiryHorizonDays,
  SalesLookbackDays,
  SlowMovingSummary,
} from '@/features/reports/types/expiry'

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
 * Priority order (requirement §25, fixed, not a score): expired → missing
 * expiry → out of stock → near expiry → low stock → never sold → no
 * recent sales. `slowMoving` is optional — the header Bell omits it
 * (requirement §49) while the Dashboard/Alert Center include it.
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
      href: `${ROUTES.expiryReport}?expiryStatus=expired`,
      fingerprint: expiredCondition.fingerprint,
    })
  }

  const missingExpiryCondition = findCondition<ExpiryAlertType, ExpiryAlertCondition>(
    expiryConditions,
    'inventory_missing_expiry',
  )
  if (missingExpiryCondition && missingExpiryCondition.affectedCount > 0) {
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
      href: `${ROUTES.expiryReport}?expiryStatus=missing_expiry`,
      fingerprint: missingExpiryCondition.fingerprint,
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
      href: `${ROUTES.inventoryReport}?stockStatus=out_of_stock`,
      fingerprint: outOfStockCondition.fingerprint,
    })
  }

  const expiringSoonCondition = findCondition<ExpiryAlertType, ExpiryAlertCondition>(
    expiryConditions,
    'inventory_expiring_soon',
  )
  if (expiringSoonCondition && expiringSoonCondition.affectedCount > 0) {
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
      // `horizon` deep-links the Expiry Report to the same operational
      // default this alert used (requirement §38) — the report's horizon
      // selector is otherwise independent/user-chosen, so a viewer opening
      // this alert sees the same batches the alert counted, not whatever
      // horizon the report happened to be left on last.
      href: `${ROUTES.expiryReport}?expiryStatus=near_expiry&horizon=${horizonDays}`,
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
      href: `${ROUTES.inventoryReport}?stockStatus=low_stock`,
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
      href: ROUTES.expiryReport,
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
      href: ROUTES.expiryReport,
      fingerprint: buildCountFingerprint(slowMoving.noSaleInLookbackCount),
    })
  }

  return alerts
}
