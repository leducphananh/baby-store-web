import { Ban, CircleCheck, FileEdit, PackageCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { ORDER_STATUS_LABEL } from '@/features/orders/utils/order-status-label'
import type { OrderStatus } from '@/features/orders/types/order'

const CONFIG: Record<
  OrderStatus,
  { label: string; variant: 'secondary' | 'info' | 'success' | 'outline'; Icon: typeof Ban }
> = {
  draft: { label: ORDER_STATUS_LABEL.draft, variant: 'secondary', Icon: FileEdit },
  confirmed: { label: ORDER_STATUS_LABEL.confirmed, variant: 'info', Icon: CircleCheck },
  completed: { label: ORDER_STATUS_LABEL.completed, variant: 'success', Icon: PackageCheck },
  cancelled: { label: ORDER_STATUS_LABEL.cancelled, variant: 'outline', Icon: Ban },
}

/** One place the order status → label/variant mapping lives (list + detail). */
export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { label, variant, Icon } = CONFIG[status]
  return (
    <Badge variant={variant} className={className}>
      <Icon />
      {label}
    </Badge>
  )
}
