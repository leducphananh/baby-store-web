import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Search } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { useClientSearchSort, type SortComparators } from '@/hooks/use-client-search-sort'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatQuantityWithUnit } from '@/utils/unit'
import { ROUTES } from '@/routes/route-paths'
import { BatchExpiryBadge } from '@/features/batches/components/batch-expiry-badge'
import { useReceiptBatches } from '@/features/batches/hooks/use-receipt-batches'
import { classifyExpiry } from '@/features/batches/utils/expiry'
import type { ReceiptBatch } from '@/features/batches/types/batch'
import type { ImportReceipt } from '@/features/import-receipts/types/import-receipt'

type BatchExpiryFilter = 'all' | 'expired' | 'expiring-soon' | 'safe'

function matchesBatchSearch(batch: ReceiptBatch, query: string): boolean {
  return (
    (batch.productName?.toLowerCase().includes(query) ?? false) ||
    (batch.productSku?.toLowerCase().includes(query) ?? false) ||
    (batch.lotNumber?.toLowerCase().includes(query) ?? false)
  )
}

function matchesBatchExpiryFilter(batch: ReceiptBatch, filter: BatchExpiryFilter): boolean {
  return filter === 'all' || classifyExpiry(batch.expirationDate).kind === filter
}

/** Nulls sort last regardless of direction — same convention `DataTable`'s own reverse-on-desc relies on. */
function compareNullableYmd(a: string | null, b: string | null): number {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a < b ? -1 : 1
}

const BATCH_COMPARATORS: SortComparators<ReceiptBatch> = {
  product: (a, b) => (a.productName ?? '').localeCompare(b.productName ?? '', 'vi'),
  lot: (a, b) => (a.lotNumber ?? '').localeCompare(b.lotNumber ?? '', 'vi'),
  mfg: (a, b) => compareNullableYmd(a.manufactureDate, b.manufactureDate),
  exp: (a, b) => compareNullableYmd(a.expirationDate, b.expirationDate),
  initial: (a, b) => a.initialQuantity - b.initialQuantity,
  remaining: (a, b) => a.remainingQuantity - b.remainingQuantity,
  cost: (a, b) => a.purchasePrice - b.purchasePrice,
}

const columns: DataTableColumn<ReceiptBatch>[] = [
  {
    id: 'product',
    header: 'Sản phẩm',
    sortable: true,
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
    sortable: true,
    cell: (batch) => <span className="font-mono text-xs">{batch.lotNumber || '—'}</span>,
  },
  {
    id: 'mfg',
    header: 'Ngày sản xuất',
    sortable: true,
    cell: (batch) => (batch.manufactureDate ? formatDate(batch.manufactureDate) : '—'),
  },
  {
    id: 'exp',
    header: 'Hạn sử dụng',
    sortable: true,
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
    sortable: true,
    cell: (batch) => formatQuantityWithUnit(batch.initialQuantity, batch.productUnit),
  },
  {
    id: 'remaining',
    header: 'Còn lại',
    align: 'right',
    sortable: true,
    cell: (batch) => formatQuantityWithUnit(batch.remainingQuantity, batch.productUnit),
  },
  {
    id: 'cost',
    header: 'Giá nhập',
    align: 'right',
    sortable: true,
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
  const batches = useMemo(() => batchesQuery.data ?? [], [batchesQuery.data])

  const [expiryFilter, setExpiryFilter] = useState<BatchExpiryFilter>('all')
  const filteredBatches = useMemo(
    () => batches.filter((batch) => matchesBatchExpiryFilter(batch, expiryFilter)),
    [batches, expiryFilter],
  )
  const {
    search,
    setSearch,
    sorting,
    setSorting,
    rows: visibleBatches,
  } = useClientSearchSort(filteredBatches, matchesBatchSearch, BATCH_COMPARATORS)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lô hàng đã tạo</CardTitle>
        <p className="text-sm text-muted-foreground">
          Mỗi dòng hàng của phiếu nhập tạo một lô khi phiếu được xác nhận. Mặc định theo thứ tự
          hạn dùng (FEFO) — chọn một cột để sắp xếp khác.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {batchesQuery.isError ? (
          <ErrorState
            message="Không thể tải danh sách lô hàng."
            onRetry={() => void batchesQuery.refetch()}
          />
        ) : batchesQuery.isLoading ? (
          <DataTable columns={columns} data={[]} getRowId={(batch) => batch.id} isLoading />
        ) : batches.length === 0 ? (
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
                  aria-label="Tìm lô hàng theo tên, SKU hoặc số lô"
                />
              </div>
              <Select
                value={expiryFilter}
                onValueChange={(value) => setExpiryFilter(value as BatchExpiryFilter)}
              >
                <SelectTrigger className="w-48" aria-label="Lọc theo trạng thái hạn sử dụng">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="expired">Hết hạn</SelectItem>
                  <SelectItem value="expiring-soon">Sắp hết hạn</SelectItem>
                  <SelectItem value="safe">Còn hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {visibleBatches.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Không tìm thấy lô hàng phù hợp"
                description="Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc."
              />
            ) : (
              <DataTable
                columns={columns}
                data={visibleBatches}
                getRowId={(batch) => batch.id}
                sorting={sorting}
                onSortingChange={setSorting}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
