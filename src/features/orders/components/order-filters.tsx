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
import type { OrderPaymentStatusFilter, OrderStatusFilter } from '@/features/orders/types/order'

/**
 * Filter row for the order list: search by code/customer/phone, order
 * status, payment status, and an `order_date` range. Kept out of the page so
 * the page stays a thin coordinator (CLAUDE.md §7) — same shape as
 * `ImportReceiptFilters`.
 */
export function OrderFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  paymentStatus,
  onPaymentStatusChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  status: OrderStatusFilter
  onStatusChange: (value: OrderStatusFilter) => void
  paymentStatus: OrderPaymentStatusFilter
  onPaymentStatusChange: (value: OrderPaymentStatusFilter) => void
  fromDate: string | null
  toDate: string | null
  onFromDateChange: (value: string | null) => void
  onToDateChange: (value: string | null) => void
}) {
  return (
    <>
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm theo mã đơn, tên hoặc số điện thoại khách hàng..."
          className="pl-8"
          aria-label="Tìm đơn hàng theo mã, khách hàng hoặc số điện thoại"
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

      <Select value={status} onValueChange={(value) => onStatusChange(value as OrderStatusFilter)}>
        <SelectTrigger className="w-44" aria-label="Lọc theo trạng thái đơn hàng">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          <SelectItem value="draft">Nháp</SelectItem>
          <SelectItem value="confirmed">Đã xác nhận</SelectItem>
          <SelectItem value="completed">Hoàn tất</SelectItem>
          <SelectItem value="cancelled">Đã hủy</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={paymentStatus}
        onValueChange={(value) => onPaymentStatusChange(value as OrderPaymentStatusFilter)}
      >
        <SelectTrigger className="w-48" aria-label="Lọc theo trạng thái thanh toán">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả thanh toán</SelectItem>
          <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
          <SelectItem value="partial">Thanh toán một phần</SelectItem>
          <SelectItem value="paid">Đã thanh toán</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Label htmlFor="order-from-date" className="text-sm text-muted-foreground">
          Từ
        </Label>
        <Input
          id="order-from-date"
          type="date"
          className="w-40"
          value={fromDate ?? ''}
          max={toDate ?? undefined}
          onChange={(event) => onFromDateChange(event.target.value || null)}
        />
        <Label htmlFor="order-to-date" className="text-sm text-muted-foreground">
          đến
        </Label>
        <Input
          id="order-to-date"
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
