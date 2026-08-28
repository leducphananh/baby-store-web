import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatQuantityWithUnit } from '@/utils/unit'
import { useProductBatches } from '@/features/products/hooks/use-product-batches'
import type { Product, ProductBatch } from '@/features/products/types/product'

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'warning' }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${tone === 'warning' ? 'text-destructive' : 'text-foreground'}`}
      >
        {value}
      </p>
    </div>
  )
}

function isExpired(date: string | null): boolean {
  if (!date) return false
  // Date-only comparison; a full expiry classification ("expiring soon"
  // threshold, days-remaining) belongs to the alerts phase, not here.
  const today = new Date().toISOString().slice(0, 10)
  return date < today
}

function getBatchColumns(unit: string | null): DataTableColumn<ProductBatch>[] {
  return [
    {
      id: 'lot',
      header: 'Số lô',
      cell: (batch) => <span className="font-mono text-xs">{batch.lotNumber || '—'}</span>,
    },
    {
      id: 'mfg',
      header: 'Ngày sản xuất',
      cell: (batch) => (batch.manufactureDate ? formatDate(batch.manufactureDate) : '—'),
    },
    {
      id: 'exp',
      header: 'Hạn sử dụng',
      cell: (batch) =>
        batch.expirationDate ? (
          <span className="flex items-center gap-2">
            {formatDate(batch.expirationDate)}
            {isExpired(batch.expirationDate) && <Badge variant="destructive">Hết hạn</Badge>}
          </span>
        ) : (
          '—'
        ),
    },
    {
      id: 'initial',
      header: 'SL nhập',
      align: 'right',
      cell: (batch) => formatQuantityWithUnit(batch.initialQuantity, unit),
    },
    {
      id: 'remaining',
      header: 'Còn lại',
      align: 'right',
      cell: (batch) => formatQuantityWithUnit(batch.remainingQuantity, unit),
    },
    {
      id: 'cost',
      header: 'Giá nhập',
      align: 'right',
      cell: (batch) => formatCurrencyVND(batch.purchasePrice),
    },
  ]
}

/**
 * On-hand stock summary + the batch (lot) breakdown, ordered FEFO. All real
 * data from `product_batches`; batches appear once import receipts create
 * them (a later phase), so an empty state here is expected, not a bug.
 */
export function ProductDetailInventory({ product }: { product: Product }) {
  const batchesQuery = useProductBatches(product.id)
  const batchColumns = getBatchColumns(product.unit)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tồn kho &amp; lô hàng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {batchesQuery.isError ? (
          <ErrorState
            message="Không thể tải dữ liệu lô hàng."
            onRetry={() => void batchesQuery.refetch()}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat
                label="Tổng tồn kho"
                value={
                  batchesQuery.data
                    ? formatQuantityWithUnit(batchesQuery.data.summary.totalRemaining, product.unit)
                    : '…'
                }
                tone={
                  batchesQuery.data &&
                  batchesQuery.data.summary.totalRemaining <= product.minimumStock
                    ? 'warning'
                    : undefined
                }
              />
              <Stat
                label="Số lô còn hàng"
                value={
                  batchesQuery.data
                    ? formatQuantityWithUnit(batchesQuery.data.summary.batchCount, 'lô')
                    : '…'
                }
              />
              <Stat
                label="Hạn dùng gần nhất"
                value={
                  batchesQuery.data?.summary.nearestExpiration
                    ? formatDate(batchesQuery.data.summary.nearestExpiration)
                    : '—'
                }
              />
            </div>

            {batchesQuery.isLoading ? (
              <DataTable
                columns={batchColumns}
                data={[]}
                getRowId={(batch) => batch.id}
                isLoading
              />
            ) : batchesQuery.data && batchesQuery.data.batches.length > 0 ? (
              <DataTable
                columns={batchColumns}
                data={batchesQuery.data.batches}
                getRowId={(batch) => batch.id}
              />
            ) : (
              <EmptyState
                title="Chưa có lô hàng nào"
                description="Lô hàng được tạo tự động khi có phiếu nhập hàng cho sản phẩm này."
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
