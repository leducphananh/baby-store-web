import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllCategories } from '@/features/categories/hooks/use-all-categories'
import type { StockStatusFilter } from '@/features/reports/types/inventory'

const ALL = '__all__'

/** Same labels as the Phase 4.6 Inventory Dashboard's own filter (`InventoryOverviewFilters`) — one stock-status vocabulary, never a second one (requirement §72). No expiry-status filter here: expiry risk analysis belongs to Phase 7.6 (requirement §87). */
const STOCK_STATUS_LABELS: Record<StockStatusFilter, string> = {
  all: 'Tất cả tồn kho',
  out_of_stock: 'Hết hàng',
  low_stock: 'Sắp hết',
  normal: 'Còn hàng',
}

/**
 * Search + category + stock-status filter row for the Inventory Report's
 * product table (requirement §26/§27/§28). Deliberately its own component
 * rather than reusing `InventoryOverviewFilters` verbatim — that one
 * requires an expiry-status filter this report doesn't have.
 */
export function InventoryReportFilters({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  stockStatus,
  onStockStatusChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  categoryId: string | null
  onCategoryChange: (value: string | null) => void
  stockStatus: StockStatusFilter
  onStockStatusChange: (value: StockStatusFilter) => void
}) {
  const categoriesQuery = useAllCategories()
  const categories = categoriesQuery.data ?? []

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs" data-tour="inventory-report-search">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm theo tên, SKU, mã vạch..."
          className="pl-8"
          aria-label="Tìm sản phẩm trong báo cáo tồn kho"
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

      <Select value={stockStatus} onValueChange={(value) => onStockStatusChange(value as StockStatusFilter)}>
        <SelectTrigger className="w-44" aria-label="Lọc theo tình trạng tồn kho">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(STOCK_STATUS_LABELS) as StockStatusFilter[]).map((value) => (
            <SelectItem key={value} value={value}>
              {STOCK_STATUS_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
