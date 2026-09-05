import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import type { InventoryCategoryRow } from '@/features/reports/types/inventory'

const columns: DataTableColumn<InventoryCategoryRow>[] = [
  {
    id: 'category',
    header: 'Danh mục',
    cell: (row) => <span className="font-medium text-foreground">{row.categoryName ?? 'Chưa phân loại'}</span>,
  },
  { id: 'product_count', header: 'Sản phẩm còn hàng', align: 'right', cell: (row) => formatNumber(row.productCount) },
  { id: 'total_quantity', header: 'Số lượng tồn', align: 'right', cell: (row) => formatNumber(row.totalQuantity) },
  {
    id: 'inventory_value',
    header: 'Giá trị tồn kho',
    align: 'right',
    cell: (row) => <span className="font-medium text-foreground">{formatCurrencyVND(row.inventoryValue)}</span>,
  },
]

/**
 * Category Performance table for the Inventory Report (requirement §31/
 * §40) — the accessible, non-chart representation of the same data
 * `InventoryCategoryChart` shows (requirement §55), and the only place a
 * category with zero current inventory value is still visible (the chart
 * filters those out to stay legible). Already sorted revenue-descending
 * by `get_inventory_category_summary()` itself — small, whole result set,
 * no pagination needed.
 */
export function InventoryCategoryTable({ data }: { data: InventoryCategoryRow[] }) {
  return <DataTable columns={columns} data={data} getRowId={(row) => row.categoryId ?? 'uncategorized'} />
}
