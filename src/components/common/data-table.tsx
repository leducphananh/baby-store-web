import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type DataTableSorting = { id: string; desc: boolean }

export type DataTableColumn<TData> = {
  id: string
  header: string
  cell: (row: TData) => ReactNode
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  className?: string
}

export type DataTablePagination = {
  /** 1-based, matches how it's shown to the user. */
  pageIndex: number
  pageSize: number
  total: number
  onPageChange: (pageIndex: number) => void
  /**
   * Opt-in "rows per page" selector — omit both this and `onPageSizeChange`
   * to keep a table exactly as before (see `table-data-grid`: don't turn
   * this on for every screen unexpectedly, enable it explicitly per table).
   * The caller owns resetting to page 1 on change, same as it already owns
   * resetting on every other filter change.
   */
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
}

/**
 * Generic table for server-driven (manual) pagination and sorting — the
 * server/query does the actual filtering/sorting/paging, this component
 * only renders whatever page of rows it's given plus the controls to ask
 * for a different one (see `table-data-grid`).
 *
 * Deliberately NOT built on `@tanstack/react-table`: this project's
 * installed major version (9.x) ships a ground-up-redesigned API (atoms/
 * store/feature-slots) with the familiar v8-style hooks only as a
 * `@deprecated` compatibility shim. Since every table in this app is
 * manually/server-driven — the actual row-model computation TanStack Table
 * exists to do client-side is never used — a small hand-rolled component on
 * top of the shared `Table` primitives covers the real requirement with
 * less risk and no dependency on an API this codebase doesn't otherwise
 * need. Reconsider if a future feature genuinely needs client-side
 * filtering/grouping.
 *
 * Loading/empty/error states are NOT handled here — the caller decides
 * whether to render `<DataTable>`, `<EmptyState>`, or `<ErrorState>` (see
 * `react-query`: every consumer handles those three explicitly). `isLoading`
 * only controls whether skeleton rows are shown in place of data rows.
 */
function DataTable<TData>({
  columns,
  data,
  getRowId,
  isLoading = false,
  sorting,
  onSortingChange,
  pagination,
  className,
}: {
  columns: DataTableColumn<TData>[]
  data: TData[]
  getRowId: (row: TData) => string
  isLoading?: boolean
  sorting?: DataTableSorting | null
  onSortingChange?: (sorting: DataTableSorting) => void
  pagination?: DataTablePagination
  className?: string
}) {
  function handleSortClick(columnId: string) {
    if (!onSortingChange) return
    const isSameColumn = sorting?.id === columnId
    onSortingChange({ id: columnId, desc: isSameColumn ? !sorting.desc : false })
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  column.align === 'right' && 'text-right',
                  column.align === 'center' && 'text-center',
                  column.className,
                )}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSortClick(column.id)}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {column.header}
                    {sorting?.id === column.id ? (
                      sorting.desc ? (
                        <ArrowDown className="size-3.5" aria-hidden="true" />
                      ) : (
                        <ArrowUp className="size-3.5" aria-hidden="true" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3.5 opacity-40" aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: pagination?.pageSize ?? 5 }, (_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : data.map((row) => (
                <TableRow key={getRowId(row)}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center',
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {pagination && !isLoading && data.length > 0 && (
        <DataTablePaginationControls pagination={pagination} />
      )}
    </div>
  )
}

function DataTablePaginationControls({ pagination }: { pagination: DataTablePagination }) {
  const { pageIndex, pageSize, total, onPageChange, pageSizeOptions, onPageSizeChange } = pagination
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (pageIndex - 1) * pageSize + 1
  const to = Math.min(pageIndex * pageSize, total)
  const showPageSizeSelector = Boolean(pageSizeOptions?.length) && Boolean(onPageSizeChange)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Hiển thị {from}–{to} trên {total}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Hiển thị</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange?.(Number(value))}
            >
              <SelectTrigger
                size="sm"
                className="w-20"
                aria-label="Số dòng mỗi trang"
                data-tour="page-size-selector"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions?.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">dòng/trang</span>
          </div>
        )}
        <span className="text-sm text-muted-foreground">
          Trang {pageIndex}/{pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={pageIndex <= 1}
          onClick={() => onPageChange(pageIndex - 1)}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pageIndex >= pageCount}
          onClick={() => onPageChange(pageIndex + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  )
}

export { DataTable }
