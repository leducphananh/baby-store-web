import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DataTableColumn } from '@/components/common/data-table'
import { formatDate } from '@/utils/date'
import type { Category } from '@/features/categories/types/category'

/**
 * Column definitions live in the feature, not the shared `DataTable` (see
 * `table-data-grid` rule 5). Row actions are a dedicated last column using
 * `DropdownMenu` (rule 7), driven by callbacks the page provides — this
 * file has no mutation/dialog-state logic of its own.
 */
export function getCategoryColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}): DataTableColumn<Category>[] {
  return [
    {
      id: 'name',
      header: 'Tên danh mục',
      sortable: true,
      cell: (category) => <span className="font-medium text-foreground">{category.name}</span>,
    },
    {
      id: 'description',
      header: 'Mô tả',
      cell: (category) => (
        <span className="text-muted-foreground">{category.description || '—'}</span>
      ),
    },
    {
      id: 'created_at',
      header: 'Ngày tạo',
      sortable: true,
      cell: (category) => (category.createdAt ? formatDate(category.createdAt) : '—'),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      align: 'right',
      cell: (category) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Thao tác với danh mục ${category.name}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Pencil />
              Sửa
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(category)}>
              <Trash2 />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
