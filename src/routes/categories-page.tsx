import { useState } from 'react'
import { FolderTree, Plus, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import { getCategoryColumns } from '@/features/categories/components/category-columns'
import { CategoryFormDialog } from '@/features/categories/components/category-form-dialog'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useDeleteCategory } from '@/features/categories/hooks/use-delete-category'
import type { Category, CategoryFilters, CategorySortField } from '@/features/categories/types/category'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

const PAGE_SIZE = 10
const SORTABLE_FIELDS: CategorySortField[] = ['name', 'created_at']

function isCategorySortField(value: string): value is CategorySortField {
  return (SORTABLE_FIELDS as string[]).includes(value)
}

function CategoriesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<{ id: CategorySortField; desc: boolean }>({
    id: 'name',
    desc: false,
  })

  const debouncedSearch = useDebouncedValue(search, 300)

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1) // a new search always starts back at page 1
  }

  const filters: CategoryFilters = {
    search: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
    sortField: sorting.id,
    sortDesc: sorting.desc,
  }

  const categoriesQuery = useCategories(filters)
  const deleteCategory = useDeleteCategory()

  const [formDialog, setFormDialog] = useState<{ category?: Category } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const columns = getCategoryColumns({
    onEdit: (category) => setFormDialog({ category }),
    onDelete: (category) => setDeleteTarget(category),
  })

  if (categoriesQuery.isLoading) {
    return <PageLoading />
  }

  if (categoriesQuery.isError) {
    return (
      <ErrorState
        message="Không thể tải danh sách danh mục. Vui lòng thử lại."
        onRetry={() => void categoriesQuery.refetch()}
      />
    )
  }

  const categories = categoriesQuery.data?.data ?? []
  const total = categoriesQuery.data?.total ?? 0
  const isSearchActive = debouncedSearch.trim().length > 0
  const isEmpty = categories.length === 0

  return (
    <PageContent
      filters={
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Tìm theo tên danh mục..."
            className="pl-8"
            aria-label="Tìm theo tên danh mục"
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
        title="Danh mục"
        description="Quản lý danh mục sản phẩm của cửa hàng."
        actions={
          <Button onClick={() => setFormDialog({})}>
            <Plus />
            Thêm danh mục
          </Button>
        }
      />

      {isEmpty ? (
        isSearchActive ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy danh mục phù hợp"
            description={`Không có danh mục nào khớp với "${debouncedSearch}".`}
            action={
              <Button variant="outline" size="sm" onClick={() => handleSearchChange('')}>
                Xóa tìm kiếm
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={FolderTree}
            title="Chưa có danh mục nào"
            description="Tạo danh mục đầu tiên để bắt đầu phân loại sản phẩm."
            action={
              <Button size="sm" onClick={() => setFormDialog({})}>
                <Plus />
                Thêm danh mục
              </Button>
            }
          />
        )
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          getRowId={(category) => category.id}
          sorting={sorting}
          onSortingChange={(next) => {
            if (isCategorySortField(next.id)) {
              setSorting({ id: next.id, desc: next.desc })
              setPage(1)
            }
          }}
          pagination={{ pageIndex: page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
        />
      )}

      <CategoryFormDialog
        open={formDialog !== null}
        onOpenChange={(open) => !open && setFormDialog(null)}
        category={formDialog?.category}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa danh mục"
        description={
          <>
            Bạn có chắc chắn muốn xóa danh mục <strong>{deleteTarget?.name}</strong>? Hành động
            này không thể hoàn tác.
          </>
        }
        confirmLabel="Xóa"
        variant="destructive"
        isConfirming={deleteCategory.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteCategory.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
          })
        }}
      />
    </PageContent>
  )
}

export { CategoriesPage }
