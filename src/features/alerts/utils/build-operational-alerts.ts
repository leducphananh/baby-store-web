import { Clock, HelpCircle, PackageX, TrendingDown } from 'lucide-react'

import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import { ROUTES } from '@/routes/route-paths'
import { buildCountFingerprint } from '@/features/alerts/utils/alert-fingerprint'
import type { OperationalAlert } from '@/features/alerts/types/alert'
import type { InventoryAlertCondition, InventoryAlertType } from '@/features/reports/types/inventory'
import type { ExpiryHorizonDays, ExpirySummary, SalesLookbackDays, SlowMovingSummary } from '@/features/reports/types/expiry'

/**
 * Looks up one inventory alert type's current occurrence row out of
 * `get_inventory_alert_conditions()`'s result — never assumes array order,
 * since the RPC's own row order isn't a contract.
 */
function findInventoryCondition(
  conditions: InventoryAlertCondition[] | undefined,
  alertType: InventoryAlertType,
): InventoryAlertCondition | undefined {
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
 * THE single place that turns authoritative Phase 7.5/7.6 business facts
 * into `OperationalAlert[]` (requirement §3/§13/§44) — the Executive
 * Dashboard's Attention section, the header Bell/popover, and the Alert
 * Center all call this same function rather than each re-deriving alert
 * conditions themselves. No inventory/expiry/slow-moving math happens
 * here — every count/value is read verbatim off the summaries already
 * computed by `get_inventory_alert_conditions()` (out_of_stock/low_stock,
 * Phase 8.2 — itself grouped from `product_inventory_overview.stock_status`,
 * Phase 7.5's authoritative classification)/`get_expiry_summary()`/
 * `get_slow_moving_summary()`.
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
  expiry,
  slowMoving,
  horizonDays,
  lookbackDays,
}: {
  inventoryConditions: InventoryAlertCondition[] | undefined
  expiry: ExpirySummary | undefined
  slowMoving?: SlowMovingSummary | undefined
  horizonDays: ExpiryHorizonDays
  lookbackDays?: SalesLookbackDays
}): OperationalAlert[] {
  const alerts: OperationalAlert[] = []

  if ((expiry?.expiredBatchCount ?? 0) > 0) {
    alerts.push({
      key: 'inventory_expired',
      type: 'inventory_expired',
      severity: 'critical',
      icon: PackageX,
      title: `${formatNumber(expiry!.expiredBatchCount)} lô hàng đã hết hạn`,
      description: `Giá trị tồn: ${formatCurrencyVND(expiry!.expiredInventoryValue)}`,
      href: ROUTES.expiryReport,
      fingerprint: buildCountFingerprint(expiry!.expiredBatchCount, expiry!.expiredInventoryValue),
    })
  }

  if ((expiry?.missingExpiryBatchCount ?? 0) > 0) {
    alerts.push({
      key: 'inventory_missing_expiry',
      type: 'inventory_missing_expiry',
      severity: 'warning',
      icon: HelpCircle,
      title: `${formatNumber(expiry!.missingExpiryBatchCount)} lô hàng còn tồn chưa có hạn sử dụng`,
      href: ROUTES.expiryReport,
      fingerprint: buildCountFingerprint(expiry!.missingExpiryBatchCount),
    })
  }

  const outOfStockCondition = findInventoryCondition(inventoryConditions, 'inventory_out_of_stock')
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

  if ((expiry?.nearExpiryBatchCount ?? 0) > 0) {
    alerts.push({
      key: 'inventory_expiring_soon',
      type: 'inventory_expiring_soon',
      severity: 'warning',
      icon: Clock,
      title: `${formatNumber(expiry!.nearExpiryBatchCount)} lô sắp hết hạn trong ${horizonDays} ngày tới`,
      description: `Giá trị tồn: ${formatCurrencyVND(expiry!.nearExpiryInventoryValue)}`,
      href: ROUTES.expiryReport,
      fingerprint: buildCountFingerprint(expiry!.nearExpiryBatchCount, expiry!.nearExpiryInventoryValue),
    })
  }

  const lowStockCondition = findInventoryCondition(inventoryConditions, 'inventory_low_stock')
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
