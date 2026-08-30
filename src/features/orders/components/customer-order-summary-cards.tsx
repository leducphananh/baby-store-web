import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatQuantityWithUnit } from '@/utils/unit'
import { useCustomerOrderSummary } from '@/features/orders/hooks/use-customer-order-summary'

/** Same small stat-tile shape as `ProductDetailInventory`'s local `Stat`. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

/**
 * "Tổng số đơn hàng" / "Tổng chi tiêu" / "Đơn gần nhất" — from the
 * aggregated `customer_order_summary` view (see
 * `get-customer-order-summary.ts`), one query regardless of order count.
 * "Tổng chi tiêu" only counts `completed` orders — see the type doc on
 * `CustomerOrderSummary` for why that's the only safely-derivable figure.
 */
export function CustomerOrderSummaryCards({ customerId }: { customerId: string }) {
  const summaryQuery = useCustomerOrderSummary(customerId)
  const summary = summaryQuery.data

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tổng quan mua hàng</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat
            label="Tổng số đơn hàng"
            value={summary ? formatQuantityWithUnit(summary.totalOrders, 'đơn') : '…'}
          />
          <Stat
            label="Tổng chi tiêu (đơn hoàn tất)"
            value={summary ? formatCurrencyVND(summary.totalSpent) : '…'}
          />
          <Stat
            label="Đơn gần nhất"
            value={summary?.lastOrderDate ? formatDate(summary.lastOrderDate) : '—'}
          />
        </div>
      </CardContent>
    </Card>
  )
}
