import { useState } from 'react'
import { ChevronsUpDown, Loader2, PackageSearch } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatQuantityWithUnit } from '@/utils/unit'
import { useSearchProducts } from '@/features/products/hooks/use-search-products'
import type { ProductSearchResult } from '@/features/products/api/search-products'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

/**
 * Search-as-you-type product picker: type to filter (name/SKU/barcode),
 * arrow keys + Enter to pick, Escape to dismiss — the "keyboard-efficient
 * input" the import receipt line editor needs (see the Phase 4.2 task and
 * `accessibility`). Built on the shared `Command`/`Popover` primitives, not
 * a plain `<Select>`: the product catalog can run into the hundreds, and a
 * `<Select>` has no search.
 *
 * Reusable beyond import receipts — order line entry will want the exact
 * same picker later.
 */
function ProductComboBox({
  onSelect,
  disabled,
  placeholder = 'Tìm theo tên hoặc SKU...',
  sellableOnly = false,
  stockLabel = 'Tồn',
}: {
  onSelect: (product: ProductSearchResult) => void
  disabled?: boolean
  placeholder?: string
  /** Passed straight through to `useSearchProducts` — see its doc comment. */
  sellableOnly?: boolean
  /** Prefix before the stock figure, e.g. "Tồn" or "Có thể bán". */
  stockLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 250)

  const resultsQuery = useSearchProducts(debouncedQuery, { sellableOnly })
  const results = resultsQuery.data ?? []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <PackageSearch className="size-4" />
            Thêm sản phẩm...
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} />
          <CommandList>
            {resultsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Đang tìm...
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {debouncedQuery.trim()
                    ? `Không tìm thấy sản phẩm khớp với "${debouncedQuery}".`
                    : 'Không có sản phẩm đang hoạt động.'}
                </CommandEmpty>
                <CommandGroup>
                  {results.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.id}
                      onSelect={() => {
                        onSelect(product)
                        setQuery('')
                        setOpen(false)
                      }}
                      className="flex-col items-start gap-0.5"
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{product.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {stockLabel}: {formatQuantityWithUnit(product.stockQuantity, product.unit)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { ProductComboBox }
