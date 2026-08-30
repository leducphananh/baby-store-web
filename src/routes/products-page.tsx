import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Package, Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ColumnVisibilityMenu } from '@/components/common/column-visibility-menu'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import { useColumnVisibility } from '@/hooks/use-column-visibility'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePersistedPageSize } from '@/hooks/use-persisted-page-size'
import { ROUTES } from '@/routes/route-paths'
import { getProductColumns } from '@/features/products/components/product-columns'
import { ProductFilters } from '@/features/products/components/product-filters'
import { ProductFormDialog } from '@/features/products/components/product-form-dialog'
import { useProducts } from '@/features/products/hooks/use-products'
import { useDeleteProduct } from '@/features/products/hooks/use-delete-product'
import { useSetProductStatus } from '@/features/products/hooks/use-set-product-status'
import type {
  Product,
  ProductFilters as ProductFiltersState,
  ProductSortField,
  ProductStatusFilter,
} from '@/features/products/types/product'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_STORAGE_KEY = 'baby-wale.products.page-size'
const SORTABLE_FIELDS: ProductSortField[] = [
  'name',
  'sku',
  'default_purchase_price',
  'selling_price',
  'tiktok_price',
  'shopee_price',
  'created_at',
]

function isProductSortField(value: string): value is ProductSortField {
  return (SORTABLE_FIELDS as string[]).includes(value)
}

/**
 * Column visibility config for the product list — stable ids matching
 * `getProductColumns`' `DataTableColumn.id`s, never translated header text
 * (see `useColumnVisibility`). Kept not-excessively-wide by default: less
 * critical metadata (packaging unit, purchase cost) starts hidden, and the
 * Actions column can never be hidden.
 */
const PRODUCT_COLUMN_VISIBILITY_STORAGE_KEY = 'baby-wale.products.column-visibility'
const PRODUCT_COLUMNS_META = [
  { id: 'image', label: 'Ảnh', defaultVisible: true },
  { id: 'name', label: 'Tên sản phẩm', defaultVisible: true },
  { id: 'sku', label: 'SKU / Mã vạch', defaultVisible: true },
  { id: 'category', label: 'Danh mục', defaultVisible: true },
  { id: 'unit', label: 'Đơn vị bán', defaultVisible: false },
  { id: 'default_purchase_price', label: 'Giá nhập', defaultVisible: false },
  { id: 'selling_price', label: 'Giá bán', defaultVisible: true },
  { id: 'tiktok_price', label: 'Giá TikTok', defaultVisible: true },
  { id: 'shopee_price', label: 'Giá Shopee', defaultVisible: true },
  { id: 'stock', label: 'Tồn kho', defaultVisible: true },
  { id: 'status', label: 'Trạng thái', defaultVisible: true },
  { id: 'actions', label: 'Thao tác', defaultVisible: true, alwaysVisible: true },
]

function ProductsPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [status, setStatus] = useState<ProductStatusFilter>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = usePersistedPageSize(
    PAGE_SIZE_STORAGE_KEY,
    PAGE_SIZE_OPTIONS,
    DEFAULT_PAGE_SIZE,
  )
  const [sorting, setSorting] = useState<{ id: ProductSortField; desc: boolean }>({
    id: 'name',
    desc: false,
  })

  const debouncedSearch = useDebouncedValue(search, 300)

  function resetToFirstPage() {
    setPage(1)
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize)
    resetToFirstPage()
  }

  const filters: ProductFiltersState = {
    search: debouncedSearch,
    categoryId,
    status,
    page,
    pageSize,
    sortField: sorting.id,
    sortDesc: sorting.desc,
  }

  const productsQuery = useProducts(filters)
  const deleteProduct = useDeleteProduct()
  const setProductStatus = useSetProductStatus()

  const [formDialog, setFormDialog] = useState<{ product?: Product; copyFrom?: Product } | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const { visibility, setVisible } = useColumnVisibility(
    PRODUCT_COLUMN_VISIBILITY_STORAGE_KEY,
    PRODUCT_COLUMNS_META,
  )

  const allColumns = getProductColumns({
    thumbnails: productsQuery.data?.thumbnails ?? new Map<string, string>(),
    onView: (product) => navigate(ROUTES.productDetail(product.id)),
    onEdit: (product) => setFormDialog({ product }),
    onCopy: (product) => setFormDialog({ copyFrom: product }),
    onToggleStatus: (product) =>
      setProductStatus.mutate({
        id: product.id,
        status: product.status === 'active' ? 'archived' : 'active',
      }),
    onDelete: (product) => setDeleteTarget(product),
  })
  const columns = allColumns.filter((column) => visibility[column.id] ?? true)

  if (productsQuery.isLoading) {
    return <PageLoading />
  }

  if (productsQuery.isError) {
    return (
      <ErrorState
        message="Không thể tải danh sách sản phẩm. Vui lòng thử lại."
        onRetry={() => void productsQuery.refetch()}
      />
    )
  }

  const products = productsQuery.data?.data ?? []
  const total = productsQuery.data?.total ?? 0
  const isFilterActive =
    debouncedSearch.trim().length > 0 || categoryId !== null || status !== 'all'
  const isEmpty = products.length === 0

  function clearFilters() {
    setSearch('')
    setCategoryId(null)
    setStatus('all')
    resetToFirstPage()
  }

  return (
    <PageContent
      filters={
        <>
          <ProductFilters
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
            status={status}
            onStatusChange={(value) => {
              setStatus(value)
              resetToFirstPage()
            }}
          />
          <ColumnVisibilityMenu
            columns={PRODUCT_COLUMNS_META}
            visibility={visibility}
            onToggle={setVisible}
          />
        </>
      }
    >
      <PageHeader
        title="Sản phẩm"
        description="Quản lý danh mục sản phẩm, giá và định mức tồn kho của cửa hàng."
        actions={
          <Button onClick={() => setFormDialog({})} data-tour="products-add-button">
            <Plus />
            Thêm sản phẩm
          </Button>
        }
      />

      {isEmpty ? (
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
            icon={Package}
            title="Chưa có sản phẩm nào"
            description="Thêm sản phẩm đầu tiên để bắt đầu quản lý danh mục và tồn kho."
            action={
              <Button size="sm" onClick={() => setFormDialog({})}>
                <Plus />
                Thêm sản phẩm
              </Button>
            }
          />
        )
      ) : (
        <div data-tour="products-table">
          <DataTable
            columns={columns}
            data={products}
            getRowId={(product) => product.id}
            sorting={sorting}
            onSortingChange={(next) => {
              if (isProductSortField(next.id)) {
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
        </div>
      )}

      <ProductFormDialog
        open={formDialog !== null}
        onOpenChange={(open) => !open && setFormDialog(null)}
        product={formDialog?.product}
        copyFrom={formDialog?.copyFrom}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa sản phẩm"
        description={
          <>
            Bạn có chắc chắn muốn xóa sản phẩm <strong>{deleteTarget?.name}</strong>? Nếu sản phẩm
            đã phát sinh đơn hàng, phiếu nhập, lô hàng hoặc giao dịch kho, hệ thống sẽ không cho
            phép xóa — hãy chọn <strong>"Ngừng kinh doanh"</strong> để giữ lại lịch sử.
          </>
        }
        confirmLabel="Xóa"
        variant="destructive"
        isConfirming={deleteProduct.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteProduct.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })
        }}
      />
    </PageContent>
  )
}

export { ProductsPage }
