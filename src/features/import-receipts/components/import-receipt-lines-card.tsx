import { useMemo, useState } from 'react'
import { MoreHorizontal, Pencil, Search, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { useClientSearchSort, type SortComparators } from '@/hooks/use-client-search-sort'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatPricePerUnit, formatQuantityWithUnit } from '@/utils/unit'
import { ImportReceiptLineAddPanel } from '@/features/import-receipts/components/import-receipt-line-add-panel'
import { ImportReceiptLineEditDialog } from '@/features/import-receipts/components/import-receipt-line-edit-dialog'
import { useDeleteImportReceiptItem } from '@/features/import-receipts/hooks/use-delete-import-receipt-item'
import { useImportReceiptLines } from '@/features/import-receipts/hooks/use-import-receipt-lines'
import type { ImportReceipt, ImportReceiptLine } from '@/features/import-receipts/types/import-receipt'

type LineDateFilter = 'all' | 'complete' | 'missing'

function matchesLineSearch(line: ImportReceiptLine, query: string): boolean {
  return (
    (line.productName?.toLowerCase().includes(query) ?? false) ||
    (line.productSku?.toLowerCase().includes(query) ?? false) ||
    (line.lotNumber?.toLowerCase().includes(query) ?? false)
  )
}

function matchesLineDateFilter(line: ImportReceiptLine, filter: LineDateFilter): boolean {
  if (filter === 'all') return true
  const hasBoth = Boolean(line.manufactureDate) && Boolean(line.expirationDate)
  return filter === 'complete' ? hasBoth : !hasBoth
}

const LINE_COMPARATORS: SortComparators<ImportReceiptLine> = {
  product: (a, b) => (a.productName ?? '').localeCompare(b.productName ?? '', 'vi'),
  quantity: (a, b) => a.quantity - b.quantity,
  price: (a, b) => a.purchasePrice - b.purchasePrice,
  total: (a, b) => a.lineTotal - b.lineTotal,
}

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
      sortable: true,
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
      sortable: true,
      cell: (line) => formatQuantityWithUnit(line.quantity, line.productUnit),
    },
    {
      id: 'price',
      header: 'Đơn giá',
      align: 'right',
      sortable: true,
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
      sortable: true,
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
  const [dateFilter, setDateFilter] = useState<LineDateFilter>('all')

  const lines = useMemo(() => linesQuery.data ?? [], [linesQuery.data])
  // The receipt's real total — always the full line set, never the
  // currently filtered/searched view (`table-data-grid`).
  const linesValue = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const dateFilteredLines = useMemo(
    () => lines.filter((line) => matchesLineDateFilter(line, dateFilter)),
    [lines, dateFilter],
  )
  const {
    search,
    setSearch,
    sorting,
    setSorting,
    rows: visibleLines,
  } = useClientSearchSort(dateFilteredLines, matchesLineSearch, LINE_COMPARATORS)
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
        {isEditable && (
          <div data-tour="import-lines-add">
            <ImportReceiptLineAddPanel receiptId={receipt.id} />
          </div>
        )}

        <div data-tour="import-lines-table" className="space-y-3">
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
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm theo tên, SKU hoặc số lô..."
                    className="pl-8"
                    aria-label="Tìm dòng hàng theo tên, SKU hoặc số lô"
                  />
                </div>
                <Select
                  value={dateFilter}
                  onValueChange={(value) => setDateFilter(value as LineDateFilter)}
                >
                  <SelectTrigger className="w-56" aria-label="Lọc theo ngày sản xuất/hạn sử dụng">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả dòng hàng</SelectItem>
                    <SelectItem value="complete">Đã có ngày SX &amp; HSD</SelectItem>
                    <SelectItem value="missing">Thiếu ngày SX hoặc HSD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {visibleLines.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="Không tìm thấy dòng hàng phù hợp"
                  description="Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc."
                />
              ) : (
                <DataTable
                  columns={columns}
                  data={visibleLines}
                  getRowId={(line) => line.id}
                  sorting={sorting}
                  onSortingChange={setSorting}
                />
              )}

              <div className="flex justify-end gap-6 border-t pt-3 text-sm">
                <span className="text-muted-foreground">Giá trị theo dòng hàng</span>
                <span className="font-semibold text-foreground">{formatCurrencyVND(linesValue)}</span>
              </div>
            </>
          )}
        </div>
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
