import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatDate } from '@/utils/date'
import type { Customer } from '@/features/customers/types/customer'

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 text-foreground">{value || '—'}</span>
    </div>
  )
}

/**
 * Read-only detail view — reuses the `Sheet` primitive, same pattern as
 * `SupplierDetailSheet` (see `reusable-components`: extend what already
 * exists rather than adding a new detail route). Exists because the
 * customer table only shows a focused subset of columns; every field the
 * schema actually has is still reachable here.
 */
function CustomerDetailSheet({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{customer?.name ?? 'Chi tiết khách hàng'}</SheetTitle>
        </SheetHeader>

        {customer && (
          <div className="flex flex-col px-4">
            <DetailRow
              label="Trạng thái"
              value={
                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                  {customer.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </Badge>
              }
            />
            <DetailRow label="Điện thoại" value={customer.phone} />
            <DetailRow label="Email" value={customer.email} />
            <DetailRow label="Địa chỉ" value={customer.address} />
            <DetailRow
              label="Ghi chú"
              // `whitespace-pre-wrap` so line breaks the user actually typed
              // survive here — a plain string collapses them like any other
              // HTML text node. Always interpolated as text, never HTML.
              value={customer.notes ? <span className="whitespace-pre-wrap">{customer.notes}</span> : null}
            />
            <DetailRow
              label="Ngày tạo"
              value={customer.createdAt ? formatDate(customer.createdAt) : null}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export { CustomerDetailSheet }
