import { useState } from 'react'
import { Plus, Search, Truck, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import { getSupplierColumns } from '@/features/suppliers/components/supplier-columns'
import { SupplierDetailSheet } from '@/features/suppliers/components/supplier-detail-sheet'
import { SupplierFormDialog } from '@/features/suppliers/components/supplier-form-dialog'
import { useDeleteSupplier } from '@/features/suppliers/hooks/use-delete-supplier'
import { useSuppliers } from '@/features/suppliers/hooks/use-suppliers'
import type { Supplier, SupplierFilters, SupplierSortField } from '@/features/suppliers/types/supplier'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

const PAGE_SIZE = 10
// 'created_at' stays a valid SupplierSortField (the column still exists in
// the DB and the domain type — only its table column was removed from the
// list per this update), but with no sortable header left to trigger it,
// it's dropped from the reachable set here to avoid dead code.
const SORTABLE_FIELDS: SupplierSortField[] = ['name']

function isSupplierSortField(value: string): value is SupplierSortField {
  return (SORTABLE_FIELDS as string[]).includes(value)
}

function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<{ id: SupplierSortField; desc: boolean }>({
    id: 'name',
    desc: false,
  })

  const debouncedSearch = useDebouncedValue(search, 300)

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  const filters: SupplierFilters = {
    search: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
    sortField: sorting.id,
    sortDesc: sorting.desc,
  }

  const suppliersQuery = useSuppliers(filters)
  const deleteSupplier = useDeleteSupplier()

  const [formDialog, setFormDialog] = useState<{ supplier?: Supplier } | null>(null)
  const [detailTarget, setDetailTarget] = useState<Supplier | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)

  const columns = getSupplierColumns({
    onView: (supplier) => setDetailTarget(supplier),
    onEdit: (supplier) => setFormDialog({ supplier }),
    onDelete: (supplier) => setDeleteTarget(supplier),
  })

  if (suppliersQuery.isLoading) {
    return <PageLoading />
  }

  if (suppliersQuery.isError) {
    return (
      <ErrorState
        message="Không thể tải danh sách nhà cung cấp. Vui lòng thử lại."
        onRetry={() => void suppliersQuery.refetch()}
      />
    )
  }

  const suppliers = suppliersQuery.data?.data ?? []
  const total = suppliersQuery.data?.total ?? 0
  const isSearchActive = debouncedSearch.trim().length > 0
  const isEmpty = suppliers.length === 0

  return (
    <PageContent
      filters={
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Tìm theo tên, SĐT, email..."
            className="pl-8"
            aria-label="Tìm nhà cung cấp"
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Xóa tìm kiếm"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      }
    >
      <PageHeader
        title="Nhà cung cấp"
        description="Quản lý thông tin nhà cung cấp hàng hóa cho cửa hàng."
        actions={
          <Button onClick={() => setFormDialog({})}>
            <Plus />
            Thêm nhà cung cấp
          </Button>
        }
      />

      {isEmpty ? (
        isSearchActive ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy nhà cung cấp phù hợp"
            description={`Không có nhà cung cấp nào khớp với "${debouncedSearch}".`}
            action={
              <Button variant="outline" size="sm" onClick={() => handleSearchChange('')}>
                Xóa tìm kiếm
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Truck}
            title="Chưa có nhà cung cấp nào"
            description="Thêm nhà cung cấp đầu tiên để bắt đầu ghi nhận phiếu nhập hàng."
            action={
              <Button size="sm" onClick={() => setFormDialog({})}>
                <Plus />
                Thêm nhà cung cấp
              </Button>
            }
          />
        )
      ) : (
        <DataTable
          columns={columns}
          data={suppliers}
          getRowId={(supplier) => supplier.id}
          sorting={sorting}
          onSortingChange={(next) => {
            if (isSupplierSortField(next.id)) {
              setSorting({ id: next.id, desc: next.desc })
              setPage(1)
            }
          }}
          pagination={{ pageIndex: page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
        />
      )}

      <SupplierFormDialog
        open={formDialog !== null}
        onOpenChange={(open) => !open && setFormDialog(null)}
        supplier={formDialog?.supplier}
      />

      <SupplierDetailSheet
        open={detailTarget !== null}
        onOpenChange={(open) => !open && setDetailTarget(null)}
        supplier={detailTarget}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa nhà cung cấp"
        description={
          <>
            Bạn có chắc chắn muốn xóa nhà cung cấp <strong>{deleteTarget?.name}</strong>? Nếu nhà
            cung cấp đã có phiếu nhập hàng, hệ thống sẽ không cho phép xóa để bảo toàn lịch sử
            mua hàng.
          </>
        }
        confirmLabel="Xóa"
        variant="destructive"
        isConfirming={deleteSupplier.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteSupplier.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
          })
        }}
      />
    </PageContent>
  )
}

export { SuppliersPage }
