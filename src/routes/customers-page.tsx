import { useState } from 'react'
import { Plus, Search, Users, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import { getCustomerColumns } from '@/features/customers/components/customer-columns'
import { CustomerDetailSheet } from '@/features/customers/components/customer-detail-sheet'
import { CustomerFormDialog } from '@/features/customers/components/customer-form-dialog'
import { useDeleteCustomer } from '@/features/customers/hooks/use-delete-customer'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import type { Customer, CustomerFilters, CustomerSortField } from '@/features/customers/types/customer'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePersistedPageSize } from '@/hooks/use-persisted-page-size'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_STORAGE_KEY = 'baby-wale.customers.page-size'
// 'created_at' stays a valid CustomerSortField (the column exists in the DB
// and the domain type — useful later), but with no sortable header for it
// in `customer-columns.tsx`, it's left out of the reachable set here to
// avoid dead code (same reasoning as `suppliers-page.tsx`).
const SORTABLE_FIELDS: CustomerSortField[] = ['name']

function isCustomerSortField(value: string): value is CustomerSortField {
  return (SORTABLE_FIELDS as string[]).includes(value)
}

function CustomersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = usePersistedPageSize(
    PAGE_SIZE_STORAGE_KEY,
    PAGE_SIZE_OPTIONS,
    DEFAULT_PAGE_SIZE,
  )
  const [sorting, setSorting] = useState<{ id: CustomerSortField; desc: boolean }>({
    id: 'name',
    desc: false,
  })

  const debouncedSearch = useDebouncedValue(search, 300)

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize)
    setPage(1)
  }

  const filters: CustomerFilters = {
    search: debouncedSearch,
    page,
    pageSize,
    sortField: sorting.id,
    sortDesc: sorting.desc,
  }

  const customersQuery = useCustomers(filters)
  const deleteCustomer = useDeleteCustomer()

  const [formDialog, setFormDialog] = useState<{ customer?: Customer } | null>(null)
  const [detailTarget, setDetailTarget] = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const columns = getCustomerColumns({
    onView: (customer) => setDetailTarget(customer),
    onEdit: (customer) => setFormDialog({ customer }),
    onDelete: (customer) => setDeleteTarget(customer),
  })

  if (customersQuery.isLoading) {
    return <PageLoading />
  }

  if (customersQuery.isError) {
    return (
      <ErrorState
        message="Không thể tải danh sách khách hàng. Vui lòng thử lại."
        onRetry={() => void customersQuery.refetch()}
      />
    )
  }

  const customers = customersQuery.data?.data ?? []
  const total = customersQuery.data?.total ?? 0
  const isSearchActive = debouncedSearch.trim().length > 0
  const isEmpty = customers.length === 0

  return (
    <PageContent
      filters={
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Tìm theo tên, số điện thoại..."
            className="pl-8"
            aria-label="Tìm khách hàng"
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
        title="Khách hàng"
        description="Quản lý thông tin khách hàng của cửa hàng."
        actions={
          <Button onClick={() => setFormDialog({})}>
            <Plus />
            Thêm khách hàng
          </Button>
        }
      />

      {isEmpty ? (
        isSearchActive ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy khách hàng phù hợp"
            description={`Không có khách hàng nào khớp với "${debouncedSearch}".`}
            action={
              <Button variant="outline" size="sm" onClick={() => handleSearchChange('')}>
                Xóa tìm kiếm
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Chưa có khách hàng nào"
            description="Thêm khách hàng đầu tiên để bắt đầu ghi nhận đơn hàng."
            action={
              <Button size="sm" onClick={() => setFormDialog({})}>
                <Plus />
                Thêm khách hàng
              </Button>
            }
          />
        )
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          getRowId={(customer) => customer.id}
          sorting={sorting}
          onSortingChange={(next) => {
            if (isCustomerSortField(next.id)) {
              setSorting({ id: next.id, desc: next.desc })
              setPage(1)
            }
          }}
          pagination={{
            pageIndex: page,
            pageSize,
            total,
            onPageChange: setPage,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            onPageSizeChange: handlePageSizeChange,
          }}
        />
      )}

      <CustomerFormDialog
        open={formDialog !== null}
        onOpenChange={(open) => !open && setFormDialog(null)}
        customer={formDialog?.customer}
      />

      <CustomerDetailSheet
        open={detailTarget !== null}
        onOpenChange={(open) => !open && setDetailTarget(null)}
        customer={detailTarget}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa khách hàng"
        description={
          <>
            Bạn có chắc chắn muốn xóa khách hàng <strong>{deleteTarget?.name}</strong>? Nếu khách
            hàng đã có đơn hàng, hệ thống sẽ không cho phép xóa để bảo toàn lịch sử đơn hàng.
          </>
        }
        confirmLabel="Xóa"
        variant="destructive"
        isConfirming={deleteCustomer.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteCustomer.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
          })
        }}
      />
    </PageContent>
  )
}

export { CustomersPage }
