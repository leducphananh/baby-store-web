import { AlertTriangle, Clock, HelpCircle, PackageX, TrendingDown } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import { ROUTES } from '@/routes/route-paths'
import { AttentionItem, type AttentionSeverity } from '@/features/dashboard/components/attention-item'
import { useExpirySummary } from '@/features/reports/hooks/use-expiry-summary'
import { useInventoryValueSummary } from '@/features/reports/hooks/use-inventory-value-summary'
import { useSlowMovingSummary } from '@/features/reports/hooks/use-slow-moving-summary'
import type { ExpiryHorizonDays, SalesLookbackDays } from '@/features/reports/types/expiry'

/** Same pre-existing app-wide default as Phase 4's `EXPIRING_SOON_DAYS`/Phase 7.6's own default — an operational horizon for this alert list, not a re-derived threshold (requirement §27). */
const ATTENTION_HORIZON_DAYS: ExpiryHorizonDays = 30
const ATTENTION_LOOKBACK_DAYS: SalesLookbackDays = 30

type Item = {
  key: string
  icon: Parameters<typeof AttentionItem>[0]['icon']
  severity: AttentionSeverity
  title: string
  description?: string
  href: string
}

/**
 * "Cần chú ý" — factual operational alerts only, no weighted score
 * (requirement §23/§24/§73). Every count/value here is read verbatim from
 * Phase 7.5/7.6 summary RPCs — `useInventoryValueSummary()`,
 * `useExpirySummary()`, `useSlowMovingSummary()` — the same queries their
 * own report pages use (`inventory-snapshot-section.tsx` above shares this
 * exact inventory query, so React Query serves it from cache rather than
 * firing a second request). Priority order follows requirement §25:
 * expired → missing expiry → out of stock → near expiry → low stock →
 * never sold → no recent sales. Items only navigate (requirement §35/§75)
 * — never confirm/complete/cancel/adjust anything from here.
 */
export function AttentionSection() {
  const inventoryQuery = useInventoryValueSummary()
  const expiryQuery = useExpirySummary(ATTENTION_HORIZON_DAYS)
  const slowMovingQuery = useSlowMovingSummary(ATTENTION_LOOKBACK_DAYS)

  const isLoading = inventoryQuery.isLoading || expiryQuery.isLoading || slowMovingQuery.isLoading
  const hasError = inventoryQuery.isError || expiryQuery.isError || slowMovingQuery.isError

  const items: Item[] = []

  if ((expiryQuery.data?.expiredBatchCount ?? 0) > 0) {
    items.push({
      key: 'expired',
      icon: PackageX,
      severity: 'destructive',
      title: `${formatNumber(expiryQuery.data!.expiredBatchCount)} lô hàng đã hết hạn`,
      description: `Giá trị tồn: ${formatCurrencyVND(expiryQuery.data!.expiredInventoryValue)}`,
      href: ROUTES.expiryReport,
    })
  }
  if ((expiryQuery.data?.missingExpiryBatchCount ?? 0) > 0) {
    items.push({
      key: 'missing-expiry',
      icon: HelpCircle,
      severity: 'warning',
      title: `${formatNumber(expiryQuery.data!.missingExpiryBatchCount)} lô hàng còn tồn chưa có hạn sử dụng`,
      href: ROUTES.expiryReport,
    })
  }
  if ((inventoryQuery.data?.outOfStockCount ?? 0) > 0) {
    items.push({
      key: 'out-of-stock',
      icon: PackageX,
      severity: 'destructive',
      title: `${formatNumber(inventoryQuery.data!.outOfStockCount)} sản phẩm đã hết hàng`,
      href: ROUTES.inventoryReport,
    })
  }
  if ((expiryQuery.data?.nearExpiryBatchCount ?? 0) > 0) {
    items.push({
      key: 'near-expiry',
      icon: Clock,
      severity: 'warning',
      title: `${formatNumber(expiryQuery.data!.nearExpiryBatchCount)} lô sắp hết hạn trong ${ATTENTION_HORIZON_DAYS} ngày tới`,
      description: `Giá trị tồn: ${formatCurrencyVND(expiryQuery.data!.nearExpiryInventoryValue)}`,
      href: ROUTES.expiryReport,
    })
  }
  if ((inventoryQuery.data?.lowStockCount ?? 0) > 0) {
    items.push({
      key: 'low-stock',
      icon: TrendingDown,
      severity: 'warning',
      title: `${formatNumber(inventoryQuery.data!.lowStockCount)} sản phẩm sắp hết hàng`,
      href: ROUTES.inventoryReport,
    })
  }
  if ((slowMovingQuery.data?.neverSoldCount ?? 0) > 0) {
    items.push({
      key: 'never-sold',
      icon: HelpCircle,
      severity: 'info',
      title: `${formatNumber(slowMovingQuery.data!.neverSoldCount)} sản phẩm còn tồn chưa từng bán`,
      description: `Giá trị tồn: ${formatCurrencyVND(slowMovingQuery.data!.neverSoldValue)}`,
      href: ROUTES.expiryReport,
    })
  }
  if ((slowMovingQuery.data?.noSaleInLookbackCount ?? 0) > 0) {
    items.push({
      key: 'no-recent-sale',
      icon: Clock,
      severity: 'info',
      title: `${formatNumber(slowMovingQuery.data!.noSaleInLookbackCount)} sản phẩm không phát sinh bán trong ${ATTENTION_LOOKBACK_DAYS} ngày`,
      href: ROUTES.expiryReport,
    })
  }

  return (
    <section data-tour="dashboard-attention">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-muted-foreground" aria-hidden="true" />
            Cần chú ý
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasError ? (
            <ErrorState
              message="Không thể tải cảnh báo."
              onRetry={() => {
                void inventoryQuery.refetch()
                void expiryQuery.refetch()
                void slowMovingQuery.refetch()
              }}
            />
          ) : isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Hiện chưa có vấn đề cần chú ý.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <AttentionItem
                  key={item.key}
                  icon={item.icon}
                  severity={item.severity}
                  title={item.title}
                  description={item.description}
                  href={item.href}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
