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
import type {
  ExpiryStatusFilter,
  StockStatusFilter,
} from '@/features/inventory/types/inventory-overview'

const ALL = '__all__'

const STOCK_STATUS_LABELS: Record<StockStatusFilter, string> = {
  all: 'Tất cả tồn kho',
  out_of_stock: 'Hết hàng',
  low_stock: 'Dưới định mức',
  normal: 'Còn hàng',
}

const EXPIRY_STATUS_LABELS: Record<ExpiryStatusFilter, string> = {
  all: 'Tất cả hạn dùng',
  expired: 'Đã hết hạn',
  expiring_soon: 'Sắp hết hạn',
  none: 'Còn hạn / không có lô',
}

/**
 * Search + category + stock-status + expiration filter row for the
 * Inventory Dashboard's product table. Kept out of the page so the page
 * stays a thin coordinator (CLAUDE.md §7) — same pattern as `ProductFilters`.
 */
export function InventoryOverviewFilters({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  stockStatus,
  onStockStatusChange,
  expiryStatus,
  onExpiryStatusChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  categoryId: string | null
  onCategoryChange: (value: string | null) => void
  stockStatus: StockStatusFilter
  onStockStatusChange: (value: StockStatusFilter) => void
  expiryStatus: ExpiryStatusFilter
  onExpiryStatusChange: (value: ExpiryStatusFilter) => void
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

      <Select
        value={stockStatus}
        onValueChange={(value) => onStockStatusChange(value as StockStatusFilter)}
      >
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

      <Select
        value={expiryStatus}
        onValueChange={(value) => onExpiryStatusChange(value as ExpiryStatusFilter)}
      >
        <SelectTrigger className="w-48" aria-label="Lọc theo hạn dùng">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(EXPIRY_STATUS_LABELS) as ExpiryStatusFilter[]).map((value) => (
            <SelectItem key={value} value={value}>
              {EXPIRY_STATUS_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
