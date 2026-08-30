import { useState } from 'react'
import { ChevronsUpDown, Loader2, Plus, User, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useSearchCustomers } from '@/features/customers/hooks/use-search-customers'
import type { CustomerSearchResult } from '@/features/customers/api/search-customers'

/**
 * Search-as-you-type customer picker for the Create Order screen — same
 * `Command`/`Popover` shape as `ProductComboBox`. Unlike the product picker
 * (repeated "add another line"), this is a single current selection, so the
 * trigger shows what's picked (`selectedLabel`) instead of a static prompt,
 * and a "Khách lẻ" item clears it back to no customer (`orders.customer_id`
 * is nullable — a walk-in sale is a normal, supported case, not an error
 * state).
 */
function CustomerComboBox({
  selectedLabel,
  onSelect,
  onClear,
  onCreateNew,
  disabled,
  placeholder = 'Tìm theo tên hoặc số điện thoại...',
}: {
  /** Currently selected customer's name, or `null` for "Khách lẻ". */
  selectedLabel: string | null
  onSelect: (customer: CustomerSearchResult) => void
  onClear: () => void
  onCreateNew: () => void
  disabled?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 250)

  const resultsQuery = useSearchCustomers(debouncedQuery)
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
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <UserRound className="size-4 shrink-0 text-muted-foreground" />
            <span className={selectedLabel ? 'text-foreground' : 'text-muted-foreground'}>
              {selectedLabel ?? 'Khách lẻ (không chọn khách hàng)'}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandGroup>
              <CommandItem
                value="__walk_in__"
                onSelect={() => {
                  onClear()
                  setQuery('')
                  setOpen(false)
                }}
              >
                <User />
                Khách lẻ (không chọn khách hàng)
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            {resultsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Đang tìm...
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {debouncedQuery.trim()
                    ? `Không tìm thấy khách hàng khớp với "${debouncedQuery}".`
                    : 'Không có khách hàng đang hoạt động.'}
                </CommandEmpty>
                <CommandGroup>
                  {results.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.id}
                      onSelect={() => {
                        onSelect(customer)
                        setQuery('')
                        setOpen(false)
                      }}
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{customer.name}</span>
                        {customer.phone && (
                          <span className="font-mono text-xs text-muted-foreground">{customer.phone}</span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                value="__create_new__"
                onSelect={() => {
                  setOpen(false)
                  onCreateNew()
                }}
              >
                <Plus />
                Thêm khách hàng mới
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { CustomerComboBox }
