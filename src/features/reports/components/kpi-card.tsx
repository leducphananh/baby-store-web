import type { ComponentType } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Generic KPI/stat-card for report pages (Phase 7.1 foundation) — `value`
 * is a caller-supplied, pre-formatted string, so this component never hard-
 * codes a business metric or a currency/number format itself (requirement
 * §21/§22): a revenue card passes `formatCurrencyVND(...)`, an order-count
 * card passes `formatNumber(...)`, a margin card passes `formatPercent(...)`.
 *
 * `isLoading` shows a skeleton in place of `value`/`subtitle` rather than a
 * stale or zeroed number (`react-query` skill rule 5) — trend/comparison
 * (e.g. "+12,5% so với tháng trước") is intentionally not part of this
 * shape yet; requirement §25 explicitly defers it until a reliable
 * comparison period exists.
 */
export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  isLoading = false,
  className,
}: {
  title: string
  value: string
  subtitle?: string
  icon?: ComponentType<{ className?: string }>
  isLoading?: boolean
  className?: string
}) {
  return (
    <Card className={className}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm text-muted-foreground">{title}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            // Not `truncate`: a silently-cut-off number is a real problem
            // for a financial KPI (looks broken, and could hide digits) —
            // wrapping to a second line at narrow widths is the safe
            // behavior instead (found while verifying Phase 7.2's 5-wide
            // KPI row at some viewport widths).
            <p className="text-xl leading-tight font-bold wrap-break-word text-foreground">{value}</p>
          )}
          {subtitle && !isLoading && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && <Icon className="size-5 shrink-0 text-muted-foreground" />}
      </CardContent>
    </Card>
  )
}
