import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Search, ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePersistedPageSize } from '@/hooks/use-persisted-page-size'
import { ROUTES } from '@/routes/route-paths'
import { getOrderColumns } from '@/features/orders/components/order-columns'
import { OrderFilters } from '@/features/orders/components/order-filters'
import { useOrders } from '@/features/orders/hooks/use-orders'
import type {
  OrderPaymentStatusFilter,
  OrderSortField,
  OrderStatusFilter,
  OrdersFilters,
} from '@/features/orders/types/order'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_STORAGE_KEY = 'baby-wale.orders.page-size'
const SORTABLE_FIELDS: OrderSortField[] = ['order_date', 'order_number', 'total']

function isSortField(value: string): value is OrderSortField {
  return (SORTABLE_FIELDS as string[]).includes(value)
}

/**
 * Store-wide order list (Phase 6.1) — read-only for now. Order creation and
 * the lifecycle actions (confirm/complete/cancel) belong to a later,
 * domain-driven phase; this page only lists and links out to Order Detail
 * (currently a `ComingSoonPage` stub — see `route-paths.ts`).
 */
function OrdersPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrderStatusFilter>('all')
  const [paymentStatus, setPaymentStatus] = useState<OrderPaymentStatusFilter>('all')
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = usePersistedPageSize(
    PAGE_SIZE_STORAGE_KEY,
    PAGE_SIZE_OPTIONS,
    DEFAULT_PAGE_SIZE,
  )
  const [sorting, setSorting] = useState<{ id: OrderSortField; desc: boolean }>({
    id: 'order_date',
    desc: true,
  })

  const debouncedSearch = useDebouncedValue(search, 300)

  function resetToFirstPage() {
    setPage(1)
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize)
    resetToFirstPage()
  }

  const filters: OrdersFilters = {
    search: debouncedSearch,
    status,
    paymentStatus,
    fromDate,
    toDate,
    page,
    pageSize,
    sortField: sorting.id,
    sortDesc: sorting.desc,
  }

  const ordersQuery = useOrders(filters)

  const columns = getOrderColumns({
    onView: (order) => navigate(ROUTES.orderDetail(order.id)),
  })

  if (ordersQuery.isLoading) {
    return <PageLoading />
  }

  if (ordersQuery.isError) {
    return (
      <ErrorState
        message="Không thể tải danh sách đơn hàng. Vui lòng thử lại."
        onRetry={() => void ordersQuery.refetch()}
      />
    )
  }

  const orders = ordersQuery.data?.data ?? []
  const total = ordersQuery.data?.total ?? 0
  const isFilterActive =
    debouncedSearch.trim().length > 0 ||
    status !== 'all' ||
    paymentStatus !== 'all' ||
    fromDate !== null ||
    toDate !== null
  const isEmpty = orders.length === 0

  function clearFilters() {
    setSearch('')
    setStatus('all')
    setPaymentStatus('all')
    setFromDate(null)
    setToDate(null)
    resetToFirstPage()
  }

  return (
    <PageContent
      filters={
        <OrderFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            resetToFirstPage()
          }}
          status={status}
          onStatusChange={(value) => {
            setStatus(value)
            resetToFirstPage()
          }}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={(value) => {
            setPaymentStatus(value)
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
        title="Đơn hàng"
        description="Theo dõi toàn bộ đơn hàng của cửa hàng."
        actions={
          <Button onClick={() => navigate(ROUTES.newOrder)}>
            <Plus />
            Tạo đơn hàng
          </Button>
        }
      />

      {isEmpty ? (
        isFilterActive ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy đơn hàng phù hợp"
            description="Không có đơn hàng nào khớp với bộ lọc hiện tại."
            action={
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={ShoppingCart}
            title="Chưa có đơn hàng nào"
            description="Tạo đơn hàng đầu tiên để bắt đầu ghi nhận bán hàng."
            action={
              <Button size="sm" onClick={() => navigate(ROUTES.newOrder)}>
                <Plus />
                Tạo đơn hàng
              </Button>
            }
          />
        )
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          getRowId={(order) => order.id}
          sorting={sorting}
          onSortingChange={(next) => {
            if (isSortField(next.id)) {
              setSorting({ id: next.id, desc: next.desc })
              resetToFirstPage()
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
    </PageContent>
  )
}

export { OrdersPage }
