import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllCategories } from '@/features/categories/hooks/use-all-categories'

const ALL = '__all__'

/** Search + category only — no status filter here, since there is no slow-moving classification to filter by (requirement §22/§67). */
export function SlowMovingFilters({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  categoryId: string | null
  onCategoryChange: (value: string | null) => void
}) {
  const categoriesQuery = useAllCategories()
  const categories = categoriesQuery.data ?? []

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm theo tên, SKU..."
          className="pl-8"
          aria-label="Tìm sản phẩm trong phân tích hàng ít luân chuyển"
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
    </div>
  )
}
