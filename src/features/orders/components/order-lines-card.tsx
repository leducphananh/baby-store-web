import { Link } from 'react-router'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatQuantityWithUnit } from '@/utils/unit'
import { ROUTES } from '@/routes/route-paths'
import { productBatchesHref } from '@/features/batches/utils/batch-links'
import { useOrderLines } from '@/features/orders/hooks/use-order-lines'
import type { OrderLine } from '@/features/orders/types/order-detail'
import type { OrderStatus } from '@/features/orders/types/order'

const columns: DataTableColumn<OrderLine>[] = [
  {
    id: 'product',
    header: 'Sản phẩm',
    cell: (line) => (
      <div className="flex flex-col">
        {line.productId ? (
          <Link to={ROUTES.productDetail(line.productId)} className="font-medium text-foreground hover:underline">
            {line.productName ?? '—'}
          </Link>
        ) : (
          <span className="font-medium text-foreground">{line.productName ?? '—'}</span>
        )}
        {line.productSku && <span className="font-mono text-xs text-muted-foreground">{line.productSku}</span>}
      </div>
    ),
  },
  {
    id: 'quantity',
    header: 'Số lượng',
    align: 'right',
    cell: (line) => formatQuantityWithUnit(line.quantity, line.productUnit),
  },
  {
    id: 'unit_price',
    header: 'Đơn giá',
    align: 'right',
    // The historical price actually charged (`order_items.unit_price`) —
    // never the product's current `selling_price` (see `get-order-lines.ts`).
    cell: (line) => formatCurrencyVND(line.unitPrice),
  },
  {
    id: 'discount',
    header: 'Giảm giá',
    align: 'right',
    cell: (line) => (line.discount > 0 ? formatCurrencyVND(line.discount) : '—'),
  },
  {
    id: 'total',
    header: 'Thành tiền',
    align: 'right',
    cell: (line) => <span className="font-medium text-foreground">{formatCurrencyVND(line.lineTotal)}</span>,
  },
  {
    id: 'batches',
    header: 'Lô xuất kho (FEFO)',
    cell: (line) =>
      line.batches.length === 0 ? (
        <span className="text-xs text-muted-foreground">Chưa xuất kho</span>
      ) : (
        <ul className="flex flex-col gap-1">
          {line.batches.map((batch) => (
            <li key={batch.id} className="text-xs text-muted-foreground">
              {line.productId ? (
                <Link to={productBatchesHref(line.productId)} className="font-mono hover:underline">
                  {batch.lotNumber || 'Không số lô'}
                </Link>
              ) : (
                <span className="font-mono">{batch.lotNumber || 'Không số lô'}</span>
              )}
              {' · '}
              {formatQuantityWithUnit(batch.quantity, line.productUnit)}
              {batch.expirationDate && <> · HSD {formatDate(batch.expirationDate)}</>}
            </li>
          ))}
        </ul>
      ),
  },
]

/**
 * An order's line items and, once posted, exactly which batch(es) each
 * line's quantity was FEFO-allocated from (`order_item_batches` —
 * historical, never re-derived). Every batch chip links to that product's
 * batch table (`#batches`); there is no standalone batch page.
 */
export function OrderLinesCard({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const linesQuery = useOrderLines(orderId)
  const lines = linesQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiết đơn hàng</CardTitle>
      </CardHeader>
      <CardContent>
        {linesQuery.isError ? (
          <ErrorState message="Không thể tải chi tiết đơn hàng." onRetry={() => void linesQuery.refetch()} />
        ) : linesQuery.isLoading ? (
          <DataTable columns={columns} data={[]} getRowId={(line) => line.id} isLoading />
        ) : lines.length === 0 ? (
          <EmptyState
            title="Chưa có dòng hàng nào"
            description={
              status === 'draft' || status === 'confirmed'
                ? 'Đơn hàng này chưa có sản phẩm nào được ghi nhận.'
                : 'Đơn hàng này không có dòng hàng nào.'
            }
          />
        ) : (
          <DataTable columns={columns} data={lines} getRowId={(line) => line.id} />
        )}
      </CardContent>
    </Card>
  )
}
