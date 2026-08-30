import { useWatch, type Control, type FieldArrayWithId } from 'react-hook-form'
import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/empty-state'
import { IntegerField } from '@/components/common/integer-field'
import { formatCurrencyVND } from '@/utils/currency'
import { formatQuantityWithUnit } from '@/utils/unit'
import type { OrderFormValues } from '@/features/orders/schemas/order-form-schema'

type CartRow = FieldArrayWithId<OrderFormValues, 'items', 'id'> & {
  index: number
  liveQuantity: number
  liveUnitPrice: number
}

/**
 * The order's cart — one row per `useFieldArray` item, quantity/unit price
 * editable in place (no per-edit round trip: nothing here is persisted
 * until the whole order is submitted, see `create-order-page.tsx`).
 * `availableQuantity` is each line's sellable-stock snapshot from when it
 * was added (see `order-form-schema.ts`); shown next to the quantity input
 * as a live reminder, not re-fetched per keystroke.
 */
function OrderCartTable({
  control,
  fields,
  onRemove,
  disabled,
}: {
  control: Control<OrderFormValues>
  fields: FieldArrayWithId<OrderFormValues, 'items', 'id'>[]
  onRemove: (index: number) => void
  disabled?: boolean
}) {
  const watchedItems = useWatch({ control, name: 'items' })

  if (fields.length === 0) {
    return (
      <EmptyState
        title="Giỏ hàng trống"
        description="Tìm và thêm sản phẩm ở trên để bắt đầu tạo đơn hàng."
      />
    )
  }

  const rows: CartRow[] = fields.map((field, index) => ({
    ...field,
    index,
    liveQuantity: watchedItems?.[index]?.quantity ?? field.quantity,
    liveUnitPrice: watchedItems?.[index]?.unitPrice ?? field.unitPrice,
  }))

  const columns: DataTableColumn<CartRow>[] = [
    {
      id: 'product',
      header: 'Sản phẩm',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.productName}</span>
          <span className="font-mono text-xs text-muted-foreground">{row.productSku}</span>
        </div>
      ),
    },
    {
      id: 'quantity',
      header: 'Số lượng',
      cell: (row) => (
        <div className="w-28">
          <IntegerField
            control={control}
            name={`items.${row.index}.quantity`}
            label=""
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Có thể bán: {formatQuantityWithUnit(row.availableQuantity, row.unit)}
          </p>
        </div>
      ),
    },
    {
      id: 'unit_price',
      header: 'Đơn giá bán',
      cell: (row) => (
        <div className="w-32">
          <IntegerField
            control={control}
            name={`items.${row.index}.unitPrice`}
            label=""
            disabled={disabled}
          />
        </div>
      ),
    },
    {
      id: 'total',
      header: 'Thành tiền',
      align: 'right',
      cell: (row) => (
        <span className="font-medium text-foreground">
          {formatCurrencyVND(row.liveQuantity * row.liveUnitPrice)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      align: 'right',
      cell: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={() => onRemove(row.index)}
          aria-label={`Xóa ${row.productName} khỏi đơn hàng`}
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowId={(row) => row.id} />
}

export { OrderCartTable }
