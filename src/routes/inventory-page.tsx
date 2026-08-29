import { useRef, useState } from 'react'
import { PackageSearch, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { inventoryOverviewColumns } from '@/features/inventory/components/inventory-overview-columns'
import { InventoryOverviewFilters } from '@/features/inventory/components/inventory-overview-filters'
import { InventorySummaryCards } from '@/features/inventory/components/inventory-summary-cards'
import { useInventoryOverview } from '@/features/inventory/hooks/use-inventory-overview'
import { useInventorySummary } from '@/features/inventory/hooks/use-inventory-summary'
import type {
  ExpiryStatusFilter,
  InventoryOverviewFilters as InventoryOverviewFiltersState,
  InventoryOverviewSortField,
  StockStatusFilter,
} from '@/features/inventory/types/inventory-overview'

const PAGE_SIZE = 20
const SORTABLE_FIELDS: InventoryOverviewSortField[] = ['name', 'stock_quantity', 'nearest_expiration']

function isInventorySortField(value: string): value is InventoryOverviewSortField {
  return (SORTABLE_FIELDS as string[]).includes(value)
}

/**
 * Inventory Dashboard (Phase 4.6): current stock by product, sourced from
 * `product_inventory_overview` (see `get-inventory-overview.ts`) — an
 * aggregation of `products` + `product_batches` computed in Postgres, so
 * every number here is authoritative database state, never a client-side
 * guess. Low-stock/out-of-stock/expiring/expired are visually distinguished
 * by badge (icon + text, never colour alone — `accessibility`) and are all
 * filterable, not just displayed.
 */
function InventoryPage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [stockStatus, setStockStatus] = useState<StockStatusFilter>('all')
  const [expiryStatus, setExpiryStatus] = useState<ExpiryStatusFilter>('all')
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<{ id: InventoryOverviewSortField; desc: boolean }>({
    id: 'name',
    desc: false,
  })

  const tableRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebouncedValue(search, 300)

  function resetToFirstPage() {
    setPage(1)
  }

  const filters: InventoryOverviewFiltersState = {
    search: debouncedSearch,
    categoryId,
    stockStatus,
    expiryStatus,
    page,
    pageSize: PAGE_SIZE,
    sortField: sorting.id,
    sortDesc: sorting.desc,
  }

  const overviewQuery = useInventoryOverview(filters)
  const summaryQuery = useInventorySummary()

  function clearFilters() {
    setSearch('')
    setCategoryId(null)
    setStockStatus('all')
    setExpiryStatus('all')
    resetToFirstPage()
  }

  /** An alert card click is a hard reset onto exactly that alert's items — see `InventorySummaryCards`. */
  function handleAlertSelect(kind: 'out_of_stock' | 'low_stock' | 'expiring_soon' | 'expired') {
    setSearch('')
    setCategoryId(null)
    if (kind === 'out_of_stock' || kind === 'low_stock') {
      setStockStatus(kind)
      setExpiryStatus('all')
    } else {
      setExpiryStatus(kind)
      setStockStatus('all')
    }
    resetToFirstPage()
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const rows = overviewQuery.data?.data ?? []
  const total = overviewQuery.data?.total ?? 0
  const isFilterActive =
    debouncedSearch.trim().length > 0 ||
    categoryId !== null ||
    stockStatus !== 'all' ||
    expiryStatus !== 'all'
  const isEmpty = !overviewQuery.isLoading && rows.length === 0

  return (
    <PageContent
      filters={
        <InventoryOverviewFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            resetToFirstPage()
          }}
          categoryId={categoryId}
          onCategoryChange={(value) => {
            setCategoryId(value)
            resetToFirstPage()
          }}
          stockStatus={stockStatus}
          onStockStatusChange={(value) => {
            setStockStatus(value)
            resetToFirstPage()
          }}
          expiryStatus={expiryStatus}
          onExpiryStatusChange={(value) => {
            setExpiryStatus(value)
            resetToFirstPage()
          }}
        />
      }
    >
      <PageHeader
        title="Kho hàng"
        description="Tồn kho hiện tại theo sản phẩm, tổng hợp từ dữ liệu lô hàng thực tế trong hệ thống."
      />

      <InventorySummaryCards
        summary={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
        onSelect={handleAlertSelect}
      />

      <div ref={tableRef} className="scroll-mt-20">
        {overviewQuery.isError ? (
          <ErrorState
            message="Không thể tải dữ liệu tồn kho. Vui lòng thử lại."
            onRetry={() => void overviewQuery.refetch()}
          />
        ) : isEmpty ? (
          isFilterActive ? (
            <EmptyState
              icon={Search}
              title="Không tìm thấy sản phẩm phù hợp"
              description="Không có sản phẩm nào khớp với bộ lọc hiện tại."
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={PackageSearch}
              title="Chưa có sản phẩm nào"
              description="Tồn kho sẽ xuất hiện tại đây khi có sản phẩm và lô hàng trong hệ thống."
            />
          )
        ) : (
          <DataTable
            columns={inventoryOverviewColumns}
            data={rows}
            getRowId={(row) => row.productId}
            isLoading={overviewQuery.isLoading}
            sorting={sorting}
            onSortingChange={(next) => {
              if (isInventorySortField(next.id)) {
                setSorting({ id: next.id, desc: next.desc })
                resetToFirstPage()
              }
            }}
            pagination={{ pageIndex: page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
          />
        )}
      </div>
    </PageContent>
  )
}

export { InventoryPage }
