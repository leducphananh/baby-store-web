import { Link } from 'react-router'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatQuantityWithUnit } from '@/utils/unit'
import { ROUTES } from '@/routes/route-paths'
import { BatchExpiryBadge } from '@/features/batches/components/batch-expiry-badge'
import { useReceiptBatches } from '@/features/batches/hooks/use-receipt-batches'
import type { ReceiptBatch } from '@/features/batches/types/batch'
import type { ImportReceipt } from '@/features/import-receipts/types/import-receipt'

const columns: DataTableColumn<ReceiptBatch>[] = [
  {
    id: 'product',
    header: 'Sản phẩm',
    cell: (batch) => (
      <div className="flex flex-col">
        {batch.productId ? (
          <Link
            to={ROUTES.productDetail(batch.productId)}
            className="font-medium text-foreground hover:underline"
          >
            {batch.productName ?? '—'}
          </Link>
        ) : (
          <span className="font-medium text-foreground">{batch.productName ?? '—'}</span>
        )}
        {batch.productSku && (
          <span className="font-mono text-xs text-muted-foreground">{batch.productSku}</span>
        )}
      </div>
    ),
  },
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
        <div className="flex flex-col items-start gap-1">
          <span>{formatDate(batch.expirationDate)}</span>
          <BatchExpiryBadge expirationDate={batch.expirationDate} />
        </div>
      ) : (
        '—'
      ),
  },
  {
    id: 'initial',
    header: 'SL nhập',
    align: 'right',
    cell: (batch) => formatQuantityWithUnit(batch.initialQuantity, batch.productUnit),
  },
  {
    id: 'remaining',
    header: 'Còn lại',
    align: 'right',
    cell: (batch) => formatQuantityWithUnit(batch.remainingQuantity, batch.productUnit),
  },
  {
    id: 'cost',
    header: 'Giá nhập',
    align: 'right',
    cell: (batch) => formatCurrencyVND(batch.purchasePrice),
  },
]

/**
 * Stock lots created from this import receipt ("batches by receipt"). Batches
 * only exist once the receipt is `confirmed` (the confirm RPC creates one
 * per line), so for a `draft`/`cancelled` receipt this is an explanatory
 * empty state, not a bug. Rows are in FEFO order and near-expiry / expired
 * lots are badged (see `features/batches`).
 */
export function ReceiptBatchesCard({ receipt }: { receipt: ImportReceipt }) {
  const batchesQuery = useReceiptBatches(receipt.id)
  const batches = batchesQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lô hàng đã tạo</CardTitle>
        <p className="text-sm text-muted-foreground">
          Mỗi dòng hàng của phiếu nhập tạo một lô khi phiếu được xác nhận. Thứ tự theo hạn dùng
          (FEFO).
        </p>
      </CardHeader>
      <CardContent>
        {batchesQuery.isError ? (
          <ErrorState
            message="Không thể tải danh sách lô hàng."
            onRetry={() => void batchesQuery.refetch()}
          />
        ) : batchesQuery.isLoading ? (
          <DataTable columns={columns} data={[]} getRowId={(batch) => batch.id} isLoading />
        ) : batches.length > 0 ? (
          <DataTable columns={columns} data={batches} getRowId={(batch) => batch.id} />
        ) : (
          <EmptyState
            title="Chưa có lô hàng"
            description={
              receipt.status === 'confirmed'
                ? 'Phiếu nhập này không có dòng hàng nào để tạo lô.'
                : receipt.status === 'cancelled'
                  ? 'Phiếu nhập đã hủy nên không có lô hàng nào được tạo.'
                  : 'Lô hàng sẽ được tạo khi phiếu nhập được xác nhận và ghi vào kho.'
            }
          />
        )}
      </CardContent>
    </Card>
  )
}
