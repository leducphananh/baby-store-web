import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatPricePerUnit, formatQuantityWithUnit } from '@/utils/unit'
import { ImportReceiptLineAddPanel } from '@/features/import-receipts/components/import-receipt-line-add-panel'
import { ImportReceiptLineEditDialog } from '@/features/import-receipts/components/import-receipt-line-edit-dialog'
import { useDeleteImportReceiptItem } from '@/features/import-receipts/hooks/use-delete-import-receipt-item'
import { useImportReceiptLines } from '@/features/import-receipts/hooks/use-import-receipt-lines'
import type { ImportReceipt, ImportReceiptLine } from '@/features/import-receipts/types/import-receipt'

function getLineColumns({
  editable,
  onEdit,
  onRemove,
}: {
  editable: boolean
  onEdit: (line: ImportReceiptLine) => void
  onRemove: (line: ImportReceiptLine) => void
}): DataTableColumn<ImportReceiptLine>[] {
  const columns: DataTableColumn<ImportReceiptLine>[] = [
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

  if (editable) {
    columns.push({
      id: 'actions',
      header: 'Thao tác',
      align: 'right',
      cell: (line) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Thao tác với dòng hàng ${line.productName ?? ''}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(line)}>
              <Pencil />
              Sửa
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onRemove(line)}>
              <Trash2 />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    })
  }

  return columns
}

/**
 * Line items for a receipt. Editable (add/edit/remove) only while the
 * receipt is a `draft` — once `confirmed`/`cancelled` it reverts to the
 * plain read-only rendering, since a posted stock document is immutable
 * (CLAUDE.md §11, `domain-driven-frontend` rule 17; the RPCs enforce this
 * server-side regardless of what the UI shows).
 */
export function ImportReceiptLinesCard({ receipt }: { receipt: ImportReceipt }) {
  const isEditable = receipt.status === 'draft'
  const linesQuery = useImportReceiptLines(receipt.id)
  const deleteItem = useDeleteImportReceiptItem(receipt.id)

  const [editingLine, setEditingLine] = useState<ImportReceiptLine | null>(null)
  const [removingLine, setRemovingLine] = useState<ImportReceiptLine | null>(null)

  const lines = linesQuery.data ?? []
  const linesValue = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const columns = getLineColumns({
    editable: isEditable,
    onEdit: setEditingLine,
    onRemove: setRemovingLine,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiết hàng hóa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditable && <ImportReceiptLineAddPanel receiptId={receipt.id} />}

        {linesQuery.isError ? (
          <ErrorState
            message="Không thể tải chi tiết hàng hóa."
            onRetry={() => void linesQuery.refetch()}
          />
        ) : linesQuery.isLoading ? (
          <DataTable columns={columns} data={[]} getRowId={(line) => line.id} isLoading />
        ) : lines.length === 0 ? (
          <EmptyState
            title="Chưa có dòng hàng nào"
            description={
              isEditable
                ? 'Tìm và thêm sản phẩm ở trên để bắt đầu.'
                : 'Phiếu nhập này không có dòng hàng nào được ghi nhận.'
            }
          />
        ) : (
          <>
            <DataTable columns={columns} data={lines} getRowId={(line) => line.id} />
            <div className="flex justify-end gap-6 border-t pt-3 text-sm">
              <span className="text-muted-foreground">Giá trị theo dòng hàng</span>
              <span className="font-semibold text-foreground">{formatCurrencyVND(linesValue)}</span>
            </div>
          </>
        )}
      </CardContent>

      <ImportReceiptLineEditDialog
        open={editingLine !== null}
        onOpenChange={(open) => !open && setEditingLine(null)}
        receiptId={receipt.id}
        line={editingLine}
      />

      <ConfirmDialog
        open={removingLine !== null}
        onOpenChange={(open) => !open && setRemovingLine(null)}
        title="Xóa dòng hàng"
        description={
          <>
            Bạn có chắc chắn muốn xóa <strong>{removingLine?.productName}</strong> khỏi phiếu
            nhập này?
          </>
        }
        confirmLabel="Xóa"
        variant="destructive"
        isConfirming={deleteItem.isPending}
        onConfirm={() => {
          if (!removingLine) return
          deleteItem.mutate(removingLine.id, { onSettled: () => setRemovingLine(null) })
        }}
      />
    </Card>
  )
}
