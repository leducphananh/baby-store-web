import { useState } from 'react'
import { ArrowLeftRight, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import type { ProductSearchResult } from '@/features/products/api/search-products'
import { inventoryTransactionColumns } from '@/features/inventory/components/inventory-transaction-columns'
import { InventoryTransactionFilters } from '@/features/inventory/components/inventory-transaction-filters'
import { useInventoryTransactions } from '@/features/inventory/hooks/use-inventory-transactions'
import type {
  InventoryTransactionFilters as InventoryTransactionFiltersState,
  InventoryTransactionTypeFilter,
} from '@/features/inventory/types/inventory-transaction'

const PAGE_SIZE = 20

function InventoryTransactionsPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [type, setType] = useState<InventoryTransactionTypeFilter>('all')
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const filters: InventoryTransactionFiltersState = {
    productId: selectedProduct?.id ?? null,
    batchId,
    type,
    fromDate,
    toDate,
    page,
    pageSize: PAGE_SIZE,
  }

  const transactionsQuery = useInventoryTransactions(filters)

  function resetToFirstPage() {
    setPage(1)
  }

  function handleProductChange(product: ProductSearchResult | null) {
    setSelectedProduct(product)
    // A batch belongs to one product — a stale batch filter would hide everything.
    setBatchId(null)
    resetToFirstPage()
  }

  function clearFilters() {
    setSelectedProduct(null)
    setBatchId(null)
    setType('all')
    setFromDate(null)
    setToDate(null)
    resetToFirstPage()
  }

  const isFilterActive =
    selectedProduct !== null ||
    batchId !== null ||
    type !== 'all' ||
    fromDate !== null ||
    toDate !== null

  if (transactionsQuery.isLoading) {
    return <PageLoading />
  }

  if (transactionsQuery.isError) {
    return (
      <ErrorState
        message="Không thể tải lịch sử giao dịch kho. Vui lòng thử lại."
        onRetry={() => void transactionsQuery.refetch()}
      />
    )
  }

  const transactions = transactionsQuery.data?.data ?? []
  const total = transactionsQuery.data?.total ?? 0
  const isEmpty = transactions.length === 0

  return (
    <PageContent
      filters={
        <InventoryTransactionFilters
          selectedProduct={selectedProduct}
          onProductChange={handleProductChange}
          batchId={batchId}
          onBatchChange={(value) => {
            setBatchId(value)
            resetToFirstPage()
          }}
          type={type}
          onTypeChange={(value) => {
            setType(value)
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
        title="Giao dịch kho"
        description="Nhật ký mọi biến động tồn kho, ghi tự động từ nhập hàng, bán hàng và điều chỉnh. Chỉ ghi thêm — không sửa, không xóa lịch sử."
      />

      {isEmpty ? (
        isFilterActive ? (
          <EmptyState
            icon={Search}
            title="Không có giao dịch phù hợp"
            description="Không có giao dịch kho nào khớp với bộ lọc hiện tại."
            action={
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={ArrowLeftRight}
            title="Chưa có giao dịch kho nào"
            description="Giao dịch sẽ xuất hiện khi phiếu nhập được xác nhận hoặc đơn hàng được hoàn tất."
          />
        )
      ) : (
        <DataTable
          columns={inventoryTransactionColumns}
          data={transactions}
          getRowId={(transaction) => transaction.id}
          pagination={{ pageIndex: page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
        />
      )}
    </PageContent>
  )
}

export { InventoryTransactionsPage }
