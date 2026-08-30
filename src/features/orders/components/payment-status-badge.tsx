import { CircleCheck, CircleDollarSign, Wallet } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { ORDER_PAYMENT_STATUS_LABEL } from '@/features/orders/utils/order-payment-status-label'
import type { OrderPaymentStatus } from '@/features/orders/types/order'

const CONFIG: Record<
  OrderPaymentStatus,
  { label: string; variant: 'destructive' | 'warning' | 'success'; Icon: typeof Wallet }
> = {
  unpaid: { label: ORDER_PAYMENT_STATUS_LABEL.unpaid, variant: 'destructive', Icon: CircleDollarSign },
  partial: { label: ORDER_PAYMENT_STATUS_LABEL.partial, variant: 'warning', Icon: Wallet },
  paid: { label: ORDER_PAYMENT_STATUS_LABEL.paid, variant: 'success', Icon: CircleCheck },
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
