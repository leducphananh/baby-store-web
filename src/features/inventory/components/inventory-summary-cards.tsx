import { AlertTriangle, Clock, PackageX, TrendingDown } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/number'
import type { InventoryOverviewSummary } from '@/features/inventory/types/inventory-overview'

type AlertKind = 'out_of_stock' | 'low_stock' | 'expiring_soon' | 'expired'

const CARDS: {
  kind: AlertKind
  label: string
  Icon: typeof PackageX
  tone: string
}[] = [
  { kind: 'out_of_stock', label: 'Hết hàng', Icon: PackageX, tone: 'text-destructive' },
  { kind: 'low_stock', label: 'Dưới định mức', Icon: TrendingDown, tone: 'text-warning' },
  { kind: 'expiring_soon', label: 'Sắp hết hạn', Icon: Clock, tone: 'text-warning' },
  { kind: 'expired', label: 'Đã hết hạn', Icon: AlertTriangle, tone: 'text-destructive' },
]

const COUNT_KEY: Record<AlertKind, keyof InventoryOverviewSummary> = {
  out_of_stock: 'outOfStock',
  low_stock: 'lowStock',
  expiring_soon: 'expiringSoon',
  expired: 'expired',
}

/**
 * The Inventory Dashboard's alert cards — a count, a clear Vietnamese label,
 * and an icon per card (`dashboard-ui` rule 3), each one clickable and
 * applying the matching filter to the table below rather than being purely
 * informational (`dashboard-ui` rule 2). Counts are global (see
 * `InventoryOverviewSummary`'s doc comment), fetched by its own independent
 * query (`useInventorySummary`) so a slow/failed table load never blocks
 * these, and vice versa (`dashboard-ui` rule 1).
 */
export function InventorySummaryCards({
  summary,
  isLoading,
  onSelect,
}: {
  summary: InventoryOverviewSummary | undefined
  isLoading: boolean
  onSelect: (kind: AlertKind) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-tour="inventory-summary-cards">
      {CARDS.map(({ kind, label, Icon, tone }) => (
        <button
          key={kind}
          type="button"
          onClick={() => onSelect(kind)}
          className="flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left shadow-soft transition-colors hover:bg-accent/50"
        >
          <Icon className={cn('size-5', tone)} aria-hidden="true" />
          {isLoading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <span className="text-2xl font-semibold text-foreground">
              {formatNumber(summary ? summary[COUNT_KEY[kind]] : 0)}
            </span>
          )}
          <span className="text-sm text-muted-foreground">{label}</span>
        </button>
      ))}
    </div>
  )
}
