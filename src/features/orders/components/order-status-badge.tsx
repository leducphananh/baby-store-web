import { Ban, CircleCheck, FileEdit, PackageCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/features/orders/types/order'

const CONFIG: Record<
  OrderStatus,
  { label: string; variant: 'secondary' | 'info' | 'success' | 'outline'; Icon: typeof Ban }
> = {
  draft: { label: 'Nháp', variant: 'secondary', Icon: FileEdit },
  confirmed: { label: 'Đã xác nhận', variant: 'info', Icon: CircleCheck },
  completed: { label: 'Hoàn tất', variant: 'success', Icon: PackageCheck },
  cancelled: { label: 'Đã hủy', variant: 'outline', Icon: Ban },
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
