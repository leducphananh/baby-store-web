import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatPricePerUnit, formatQuantityWithUnit } from '@/utils/unit'
import { useImportReceiptLines } from '@/features/import-receipts/hooks/use-import-receipt-lines'
import type { ImportReceipt, ImportReceiptLine } from '@/features/import-receipts/types/import-receipt'

const lineColumns: DataTableColumn<ImportReceiptLine>[] = [
  {
    id: 'product',
    header: 'Sản phẩm',
    cell: (line) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{line.productName ?? '—'}</span>
        {line.productSku && (
          <span className="font-mono text-xs text-muted-foreground">{line.productSku}</span>
        )}
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
    id: 'price',
    header: 'Đơn giá',
    align: 'right',
    cell: (line) => formatPricePerUnit(line.purchasePrice, line.productUnit),
  },
  {
    id: 'lot',
    header: 'Lô / HSD',
    cell: (line) => (
      <div className="flex flex-col text-xs text-muted-foreground">
        <span>{line.lotNumber || '—'}</span>
        {line.expirationDate && <span>HSD: {formatDate(line.expirationDate)}</span>}
      </div>
    ),
  },
  {
    id: 'total',
    header: 'Thành tiền',
    align: 'right',
    cell: (line) => formatCurrencyVND(line.lineTotal),
  },
]

/**
 * Read-only line items for a receipt. Line entry, editing, and stock posting
 * (`confirm_import_receipt`) are a later phase — this shows whatever lines
 * exist (e.g. on confirmed receipts) plus the value implied by them.
 */
export function ImportReceiptLinesCard({ receipt }: { receipt: ImportReceipt }) {
  const linesQuery = useImportReceiptLines(receipt.id)
  const lines = linesQuery.data ?? []
  const linesValue = lines.reduce((sum, line) => sum + line.lineTotal, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiết hàng hóa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {linesQuery.isError ? (
          <ErrorState
            message="Không thể tải chi tiết hàng hóa."
            onRetry={() => void linesQuery.refetch()}
          />
        ) : linesQuery.isLoading ? (
          <DataTable columns={lineColumns} data={[]} getRowId={(line) => line.id} isLoading />
        ) : lines.length === 0 ? (
          <EmptyState
            title="Chưa có dòng hàng nào"
            description={
              receipt.status === 'draft'
                ? 'Phiếu nhập này chưa có chi tiết hàng hóa.'
                : 'Phiếu nhập này không có dòng hàng nào được ghi nhận.'
            }
          />
        ) : (
          <>
            <DataTable columns={lineColumns} data={lines} getRowId={(line) => line.id} />
            <div className="flex justify-end gap-6 border-t pt-3 text-sm">
              <span className="text-muted-foreground">Giá trị theo dòng hàng</span>
              <span className="font-semibold text-foreground">{formatCurrencyVND(linesValue)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
