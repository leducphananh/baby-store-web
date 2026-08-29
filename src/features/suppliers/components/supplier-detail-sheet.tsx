import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatDate } from '@/utils/date'
import type { Supplier } from '@/features/suppliers/types/supplier'

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 text-foreground">{value || '—'}</span>
    </div>
  )
}

/**
 * Read-only detail view — reuses the `Sheet` primitive from
 * `components/ui/` (see `reusable-components`: extend what already exists
 * rather than adding a new detail route). Exists because the supplier
 * table only shows a focused subset of columns; every field the schema
 * actually has is still reachable, just not crammed into the row.
 */
function SupplierDetailSheet({
  open,
  onOpenChange,
  supplier,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{supplier?.name ?? 'Chi tiết nhà cung cấp'}</SheetTitle>
        </SheetHeader>

        {supplier && (
          <div className="flex flex-col px-4">
            <DetailRow
              label="Trạng thái"
              value={
                <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                  {supplier.status === 'active' ? 'Đang hợp tác' : 'Ngừng hợp tác'}
                </Badge>
              }
            />
            <DetailRow label="Người liên hệ" value={supplier.contactPerson} />
            <DetailRow label="Điện thoại" value={supplier.phone} />
            <DetailRow label="Email" value={supplier.email} />
            <DetailRow label="Địa chỉ" value={supplier.address} />
            <DetailRow label="Mã số thuế" value={supplier.taxCode} />
            <DetailRow
              label="Ghi chú"
              // `whitespace-pre-wrap` so line breaks the user actually typed
              // survive here — a plain string collapses them like any other
              // HTML text node. Always interpolated as text, never HTML.
              value={supplier.notes ? <span className="whitespace-pre-wrap">{supplier.notes}</span> : null}
            />
            <DetailRow
              label="Ngày tạo"
              value={supplier.createdAt ? formatDate(supplier.createdAt) : null}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export { SupplierDetailSheet }
