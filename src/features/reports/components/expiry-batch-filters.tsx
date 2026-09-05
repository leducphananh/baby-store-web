import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllCategories } from '@/features/categories/hooks/use-all-categories'
import type { ExpiryStatusFilter } from '@/features/reports/types/expiry'

const ALL = '__all__'

/** "Tất cả rủi ro" = the union already scoped by the RPC (expired ∪ near-expiry-within-horizon ∪ missing-expiry) — this filter only narrows within that risk scope, it never widens it to long-dated "safe" batches (requirement §38/§39). */
const STATUS_LABELS: Record<ExpiryStatusFilter, string> = {
  all: 'Tất cả rủi ro',
  expired: 'Đã hết hạn',
  near_expiry: 'Sắp hết hạn',
  missing_expiry: 'Chưa có HSD',
}

export function ExpiryBatchFilters({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  statusFilter,
  onStatusFilterChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  categoryId: string | null
  onCategoryChange: (value: string | null) => void
  statusFilter: ExpiryStatusFilter
  onStatusFilterChange: (value: ExpiryStatusFilter) => void
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
          placeholder="Tìm theo tên, SKU, mã lô..."
          className="pl-8"
          aria-label="Tìm lô hàng theo sản phẩm, SKU hoặc mã lô"
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

      <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as ExpiryStatusFilter)}>
        <SelectTrigger className="w-44" aria-label="Lọc theo tình trạng hạn sử dụng">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(STATUS_LABELS) as ExpiryStatusFilter[]).map((value) => (
            <SelectItem key={value} value={value}>
              {STATUS_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
