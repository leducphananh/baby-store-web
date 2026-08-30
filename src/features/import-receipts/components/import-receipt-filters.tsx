import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAllSuppliers } from '@/features/suppliers/hooks/use-all-suppliers'
import type { ImportReceiptStatusFilter } from '@/features/import-receipts/types/import-receipt'

const ALL = '__all__'

/**
 * Filter row for the import-receipt list: search by code, supplier, status,
 * and an `import_date` range. Kept out of the page so the page stays a thin
 * coordinator (CLAUDE.md §7). Supplier options load dynamically.
 */
export function ImportReceiptFilters({
  search,
  onSearchChange,
  supplierId,
  onSupplierChange,
  status,
  onStatusChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  supplierId: string | null
  onSupplierChange: (value: string | null) => void
  status: ImportReceiptStatusFilter
  onStatusChange: (value: ImportReceiptStatusFilter) => void
  fromDate: string | null
  toDate: string | null
  onFromDateChange: (value: string | null) => void
  onToDateChange: (value: string | null) => void
}) {
  const suppliersQuery = useAllSuppliers()
  const suppliers = suppliersQuery.data ?? []

  return (
    <>
      <div className="relative w-full max-w-xs" data-tour="imports-search">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm theo mã phiếu..."
          className="pl-8"
          aria-label="Tìm phiếu nhập theo mã"
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
        value={supplierId ?? ALL}
        onValueChange={(value) => onSupplierChange(value === ALL ? null : value)}
        disabled={suppliersQuery.isLoading}
      >
        <SelectTrigger className="w-56" aria-label="Lọc theo nhà cung cấp" data-tour="imports-filters">
          <SelectValue placeholder="Tất cả nhà cung cấp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tất cả nhà cung cấp</SelectItem>
          {suppliers.map((supplier) => (
            <SelectItem key={supplier.id} value={supplier.id}>
              {supplier.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(value) => onStatusChange(value as ImportReceiptStatusFilter)}>
        <SelectTrigger className="w-40" aria-label="Lọc theo trạng thái">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          <SelectItem value="draft">Nháp</SelectItem>
          <SelectItem value="confirmed">Đã xác nhận</SelectItem>
          <SelectItem value="cancelled">Đã hủy</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Label htmlFor="import-from-date" className="text-sm text-muted-foreground">
          Từ
        </Label>
        <Input
          id="import-from-date"
          type="date"
          className="w-40"
          value={fromDate ?? ''}
          max={toDate ?? undefined}
          onChange={(event) => onFromDateChange(event.target.value || null)}
        />
        <Label htmlFor="import-to-date" className="text-sm text-muted-foreground">
          đến
        </Label>
        <Input
          id="import-to-date"
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
