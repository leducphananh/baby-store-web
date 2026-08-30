import { Columns3 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type ColumnVisibilityOption = {
  id: string
  label: string
  /** Omitted from the menu entirely — pair with a table's `alwaysVisible` column. */
  alwaysVisible?: boolean
}

/**
 * "Cột hiển thị" toolbar control — a checkbox dropdown for showing/hiding a
 * `DataTable`'s columns by stable id. Feature-agnostic: pairs with
 * `useColumnVisibility` for the actual state/persistence, this component
 * only renders the toggles (see `table-data-grid`). Reuses the existing
 * `DropdownMenuCheckboxItem` primitive rather than a new dependency.
 */
export function ColumnVisibilityMenu({
  columns,
  visibility,
  onToggle,
}: {
  columns: ColumnVisibilityOption[]
  visibility: Record<string, boolean>
  onToggle: (id: string, visible: boolean) => void
}) {
  const toggleable = columns.filter((column) => !column.alwaysVisible)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" data-tour="column-visibility-button">
          <Columns3 />
          Cột hiển thị
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {toggleable.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={visibility[column.id] ?? true}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => onToggle(column.id, checked)}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
