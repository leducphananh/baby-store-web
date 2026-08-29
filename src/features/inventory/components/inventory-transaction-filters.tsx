import { X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/utils/date'
import { ProductComboBox } from '@/features/products/components/product-combobox'
import type { ProductSearchResult } from '@/features/products/api/search-products'
import { useProductBatchOptions } from '@/features/batches/hooks/use-product-batch-options'
import { INVENTORY_TYPE_META } from '@/features/inventory/utils/inventory-transaction-labels'
import {
  INVENTORY_TRANSACTION_TYPES,
  type InventoryTransactionTypeFilter,
} from '@/features/inventory/types/inventory-transaction'

const ALL = '__all__'

/**
 * Filter row for the inventory-transaction ledger: product (search-as-you-
 * type), batch (only once a product is chosen — "when relevant"),
 * transaction type, and a `created_at` date range. Kept out of the page so
 * the page stays a thin coordinator (CLAUDE.md §7).
 */
export function InventoryTransactionFilters({
  selectedProduct,
  onProductChange,
  batchId,
  onBatchChange,
  type,
  onTypeChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: {
  selectedProduct: ProductSearchResult | null
  onProductChange: (product: ProductSearchResult | null) => void
  batchId: string | null
  onBatchChange: (value: string | null) => void
  type: InventoryTransactionTypeFilter
  onTypeChange: (value: InventoryTransactionTypeFilter) => void
  fromDate: string | null
  toDate: string | null
  onFromDateChange: (value: string | null) => void
  onToDateChange: (value: string | null) => void
}) {
  const batchOptionsQuery = useProductBatchOptions(selectedProduct?.id)
  const batchOptions = batchOptionsQuery.data ?? []

  return (
    <>
      <div className="w-full max-w-xs">
        {selectedProduct ? (
          <div className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
            <span className="min-w-0 flex-1 truncate">
              <span className="font-medium text-foreground">{selectedProduct.name}</span>{' '}
              <span className="font-mono text-xs text-muted-foreground">{selectedProduct.sku}</span>
            </span>
            <button
              type="button"
              onClick={() => onProductChange(null)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Bỏ lọc theo sản phẩm"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <ProductComboBox onSelect={onProductChange} placeholder="Lọc theo sản phẩm..." />
        )}
      </div>

      <Select
        value={batchId ?? ALL}
        onValueChange={(value) => onBatchChange(value === ALL ? null : value)}
        disabled={!selectedProduct || batchOptionsQuery.isLoading}
      >
        <SelectTrigger className="w-56" aria-label="Lọc theo lô hàng">
          <SelectValue placeholder="Tất cả lô hàng" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tất cả lô hàng</SelectItem>
          {batchOptions.map((batch) => (
            <SelectItem key={batch.id} value={batch.id}>
              {batch.lotNumber || 'Lô không số'}
              {batch.expirationDate ? ` · HSD ${formatDate(batch.expirationDate)}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={type}
        onValueChange={(value) => onTypeChange(value as InventoryTransactionTypeFilter)}
      >
        <SelectTrigger className="w-52" aria-label="Lọc theo loại giao dịch">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả loại</SelectItem>
          {INVENTORY_TRANSACTION_TYPES.map((value) => (
            <SelectItem key={value} value={value}>
              {INVENTORY_TYPE_META[value].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Label htmlFor="inv-from-date" className="text-sm text-muted-foreground">
          Từ
        </Label>
        <Input
          id="inv-from-date"
          type="date"
          className="w-40"
          value={fromDate ?? ''}
          max={toDate ?? undefined}
          onChange={(event) => onFromDateChange(event.target.value || null)}
        />
        <Label htmlFor="inv-to-date" className="text-sm text-muted-foreground">
          đến
        </Label>
        <Input
          id="inv-to-date"
          type="date"
          className="w-40"
          value={toDate ?? ''}
          min={fromDate ?? undefined}
          onChange={(event) => onToDateChange(event.target.value || null)}
        />
      </div>
    </>
  )
}
