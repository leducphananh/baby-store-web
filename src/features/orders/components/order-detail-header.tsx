import { Link } from 'react-router'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DetailRow } from '@/components/common/detail-row'
import { formatDate, formatDateTime } from '@/utils/date'
import { ROUTES } from '@/routes/route-paths'
import type { OrderDetail } from '@/features/orders/types/order-detail'

/** Read-only header facts for one order — same shape as `ImportReceiptDetailHeader`. */
export function OrderDetailHeader({ order }: { order: OrderDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin đơn hàng</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          <DetailRow label="Mã đơn hàng" value={<span className="font-mono">{order.orderNumber}</span>} />
          <DetailRow
            label="Khách hàng"
            value={
              order.customerId ? (
                <Link to={ROUTES.customerDetail(order.customerId)} className="text-foreground hover:underline">
                  {order.customerName ?? 'Khách hàng'}
                  {order.customerPhone ? ` · ${order.customerPhone}` : ''}
                </Link>
              ) : (
                'Khách lẻ (không gắn khách hàng)'
              )
            }
          />
          <DetailRow label="Ngày đặt" value={formatDate(order.orderDate)} />
          <DetailRow label="Ghi chú" value={order.note ? <span className="whitespace-pre-wrap">{order.note}</span> : null} />
          <DetailRow label="Người tạo" value={order.createdByName} />
          <DetailRow label="Ngày tạo" value={order.createdAt ? formatDateTime(order.createdAt) : null} />
          <DetailRow label="Cập nhật lần cuối" value={order.updatedAt ? formatDateTime(order.updatedAt) : null} />
          {order.status === 'completed' && (
            <DetailRow label="Hoàn tất lúc" value={order.completedAt ? formatDateTime(order.completedAt) : null} />
          )}
          {order.status === 'cancelled' && (
            <DetailRow label="Hủy lúc" value={order.cancelledAt ? formatDateTime(order.cancelledAt) : null} />
          )}
        </dl>
      </CardContent>
    </Card>
  )
}
