import { PackageCheck, PackageX, TrendingDown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { StockStatus } from '@/features/inventory/types/inventory-overview'

const CONFIG: Record<
  StockStatus,
  { label: string; variant: 'destructive' | 'warning' | 'success'; Icon: typeof PackageX }
> = {
  out_of_stock: { label: 'Hết hàng', variant: 'destructive', Icon: PackageX },
  low_stock: { label: 'Dưới định mức', variant: 'warning', Icon: TrendingDown },
  normal: { label: 'Còn hàng', variant: 'success', Icon: PackageCheck },
}

/**
 * The one place a product's stock status becomes a badge. Unlike
 * `BatchExpiryBadge` (which renders nothing for a "safe" batch so a mostly-
 * fine table stays quiet), every state here renders a badge — the Inventory
 * Dashboard's own requirement is that "normal" is *also* visually
 * distinguished from low/out-of-stock, not just implied by the absence of a
 * warning. State is carried by icon + text, never colour alone
 * (`accessibility`).
 */
export function StockStatusBadge({ status, className }: { status: StockStatus; className?: string }) {
  const { label, variant, Icon } = CONFIG[status]
  return (
    <Badge variant={variant} className={className}>
      <Icon />
      {label}
    </Badge>
  )
}
