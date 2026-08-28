import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PackagePlus, Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { ROUTES } from '@/routes/route-paths'
import { getImportReceiptColumns } from '@/features/import-receipts/components/import-receipt-columns'
import { ImportReceiptFilters } from '@/features/import-receipts/components/import-receipt-filters'
import { ImportReceiptFormDialog } from '@/features/import-receipts/components/import-receipt-form-dialog'
import { useCancelImportReceipt } from '@/features/import-receipts/hooks/use-cancel-import-receipt'
import { useImportReceipts } from '@/features/import-receipts/hooks/use-import-receipts'
import type {
  ImportReceipt,
  ImportReceiptFilters as ImportReceiptFiltersState,
  ImportReceiptSortField,
  ImportReceiptStatusFilter,
} from '@/features/import-receipts/types/import-receipt'

const PAGE_SIZE = 10
const SORTABLE_FIELDS: ImportReceiptSortField[] = ['import_date', 'receipt_number', 'created_at']

function isSortField(value: string): value is ImportReceiptSortField {
  return (SORTABLE_FIELDS as string[]).includes(value)
}

function ImportsPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [supplierId, setSupplierId] = useState<string | null>(null)
  const [status, setStatus] = useState<ImportReceiptStatusFilter>('all')
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<{ id: ImportReceiptSortField; desc: boolean }>({
    id: 'import_date',
    desc: true,
  })

  const debouncedSearch = useDebouncedValue(search, 300)

  function resetToFirstPage() {
    setPage(1)
  }

  const filters: ImportReceiptFiltersState = {
    search: debouncedSearch,
    supplierId,
    status,
    fromDate,
    toDate,
    page,
    pageSize: PAGE_SIZE,
    sortField: sorting.id,
    sortDesc: sorting.desc,
  }

  const receiptsQuery = useImportReceipts(filters)
  const cancelReceipt = useCancelImportReceipt()

  const [formDialog, setFormDialog] = useState<{ receipt?: ImportReceipt } | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ImportReceipt | null>(null)

  const columns = getImportReceiptColumns({
    onView: (receipt) => navigate(ROUTES.importDetail(receipt.id)),
    onEdit: (receipt) => setFormDialog({ receipt }),
    onCancel: (receipt) => setCancelTarget(receipt),
  })

  if (receiptsQuery.isLoading) {
    return <PageLoading />
  }

  if (receiptsQuery.isError) {
    return (
      <ErrorState
        message="Không thể tải danh sách phiếu nhập. Vui lòng thử lại."
        onRetry={() => void receiptsQuery.refetch()}
      />
    )
  }

  const receipts = receiptsQuery.data?.data ?? []
  const total = receiptsQuery.data?.total ?? 0
  const isFilterActive =
    debouncedSearch.trim().length > 0 ||
    supplierId !== null ||
    status !== 'all' ||
    fromDate !== null ||
    toDate !== null
  const isEmpty = receipts.length === 0

  function clearFilters() {
    setSearch('')
    setSupplierId(null)
    setStatus('all')
    setFromDate(null)
    setToDate(null)
    resetToFirstPage()
  }

  return (
    <PageContent
      filters={
        <ImportReceiptFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            resetToFirstPage()
          }}
          supplierId={supplierId}
          onSupplierChange={(value) => {
            setSupplierId(value)
            resetToFirstPage()
          }}
          status={status}
          onStatusChange={(value) => {
            setStatus(value)
            resetToFirstPage()
          }}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={(value) => {
            setFromDate(value)
            resetToFirstPage()
          }}
          onToDateChange={(value) => {
            setToDate(value)
            resetToFirstPage()
          }}
        />
      }
    >
      <PageHeader
        title="Nhập hàng"
        description="Quản lý phiếu nhập hàng từ nhà cung cấp."
        actions={
          <Button onClick={() => setFormDialog({})}>
            <Plus />
            Tạo phiếu nhập
          </Button>
        }
      />

      {isEmpty ? (
        isFilterActive ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy phiếu nhập phù hợp"
            description="Không có phiếu nhập nào khớp với bộ lọc hiện tại."
            action={
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={PackagePlus}
            title="Chưa có phiếu nhập nào"
            description="Tạo phiếu nhập đầu tiên để ghi nhận hàng hóa nhập từ nhà cung cấp."
            action={
              <Button size="sm" onClick={() => setFormDialog({})}>
                <Plus />
                Tạo phiếu nhập
              </Button>
            }
          />
        )
      ) : (
        <DataTable
          columns={columns}
          data={receipts}
          getRowId={(receipt) => receipt.id}
          sorting={sorting}
          onSortingChange={(next) => {
            if (isSortField(next.id)) {
              setSorting({ id: next.id, desc: next.desc })
              resetToFirstPage()
            }
          }}
          pagination={{ pageIndex: page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
        />
      )}

      <ImportReceiptFormDialog
        open={formDialog !== null}
        onOpenChange={(open) => !open && setFormDialog(null)}
        receipt={formDialog?.receipt}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Hủy phiếu nhập"
        description={
          <>
            Bạn có chắc chắn muốn hủy phiếu nhập <strong>{cancelTarget?.receiptNumber}</strong>?
            Phiếu sẽ chuyển sang trạng thái "Đã hủy" và không thể chỉnh sửa lại. Chỉ phiếu ở trạng
            thái nháp mới hủy được.
          </>
        }
        confirmLabel="Hủy phiếu"
        variant="destructive"
        isConfirming={cancelReceipt.isPending}
        onConfirm={() => {
          if (!cancelTarget) return
          cancelReceipt.mutate(cancelTarget.id, { onSettled: () => setCancelTarget(null) })
        }}
      />
    </PageContent>
  )
}

export { ImportsPage }
