import { CircleCheck, CircleDollarSign, Wallet } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { OrderPaymentStatus } from '@/features/orders/types/order'

const CONFIG: Record<
  OrderPaymentStatus,
  { label: string; variant: 'destructive' | 'warning' | 'success'; Icon: typeof Wallet }
> = {
  unpaid: { label: 'Chưa thanh toán', variant: 'destructive', Icon: CircleDollarSign },
  partial: { label: 'Thanh toán một phần', variant: 'warning', Icon: Wallet },
  paid: { label: 'Đã thanh toán', variant: 'success', Icon: CircleCheck },
}

/** One place the order payment-status → label/variant mapping lives. */
export function PaymentStatusBadge({
  status,
  className,
}: {
  status: OrderPaymentStatus
  className?: string
}) {
  const { label, variant, Icon } = CONFIG[status]
  return (
    <Badge variant={variant} className={className}>
      <Icon />
      {label}
    </Badge>
  )
}
