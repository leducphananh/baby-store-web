import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAllCategories } from '@/features/categories/hooks/use-all-categories'
import type { ProductStatusFilter } from '@/features/products/types/product'

const ALL = '__all__'

/**
 * Search + category + status filter row for the product list. Kept out of
 * the page component so the page stays a thin coordinator (CLAUDE.md §7).
 * Category options are loaded dynamically — never hardcoded.
 */
export function ProductFilters({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  status,
  onStatusChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  categoryId: string | null
  onCategoryChange: (value: string | null) => void
  status: ProductStatusFilter
  onStatusChange: (value: ProductStatusFilter) => void
}) {
  const categoriesQuery = useAllCategories()
  const categories = categoriesQuery.data ?? []

  return (
    <>
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm theo tên, SKU, mã vạch..."
          className="pl-8"
          aria-label="Tìm sản phẩm"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Xóa tìm kiếm"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <Select
        value={categoryId ?? ALL}
        onValueChange={(value) => onCategoryChange(value === ALL ? null : value)}
        disabled={categoriesQuery.isLoading}
      >
        <SelectTrigger className="w-52" aria-label="Lọc theo danh mục">
          <SelectValue placeholder="Tất cả danh mục" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tất cả danh mục</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(value) => onStatusChange(value as ProductStatusFilter)}>
        <SelectTrigger className="w-44" aria-label="Lọc theo trạng thái">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          <SelectItem value="active">Đang kinh doanh</SelectItem>
          <SelectItem value="archived">Ngừng kinh doanh</SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}
