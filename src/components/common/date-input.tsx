import { useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

import { Input } from '@/components/ui/input'

const YMD = /^\d{4}-\d{2}-\d{2}$/
const DISPLAY = /^(\d{2})\/(\d{2})\/(\d{4})$/

/** `"YYYY-MM-DD"` (or `""`) → `"dd/mm/yyyy"` (or `""`) for display. */
export function ymdToDisplay(value: string): string {
  if (!YMD.test(value)) return ''
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

/** Raw digits typed so far, auto-slashed into `dd/mm/yyyy` as they go. */
export function formatDigits(digits: string): string {
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/**
 * A complete `"dd/mm/yyyy"` string, only once it's a real calendar date
 * (rejects e.g. `31/02/2026`) → `"YYYY-MM-DD"`; otherwise `null`.
 */
export function parseDisplayDate(display: string): string | null {
  const match = DISPLAY.exec(display)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  const day = Number(dd)
  const month = Number(mm)
  const year = Number(yyyy)
  const date = new Date(year, month - 1, day)
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return isRealDate ? `${yyyy}-${mm}-${dd}` : null
}

type DateInputProps = Omit<ComponentPropsWithoutRef<typeof Input>, 'value' | 'onChange' | 'type'> & {
  /** `""` or a plain `YYYY-MM-DD` (Postgres `date` shape) — never a display string. */
  value: string
  onChange: (value: string) => void
}

/**
 * Plain (non-RHF-bound) `dd/mm/yyyy` masked date input — the filter-row
 * counterpart to `DateField`, for date-range filters (`OrderFilters`,
 * `ImportReceiptFilters`, `InventoryTransactionFilters`,
 * `ReportDateRangePicker`) that hold their own `fromDate`/`toDate` state
 * rather than going through react-hook-form. Same Vietnamese digit-order
 * convention (`vietnamese-business-ui`), same `YYYY-MM-DD` on the wire.
 *
 * Unlike `DateField`, an incomplete or impossible typed date is never
 * committed upward — there's no Zod refine downstream here to catch it and
 * show a message, so silently forwarding a bad `fromDate`/`toDate` would
 * just break the query. Only a full, real calendar date or a cleared field
 * calls `onChange`; anything in between is local display state only, and
 * resolves once the user finishes (or clears) it.
 *
 * `value` can also change from outside while this stays mounted (e.g. a
 * "Xóa bộ lọc" reset, or a preset button) — unlike `DateField`'s call
 * sites, these filter rows don't remount per change. The render-time
 * `value !== lastValue` check re-derives `text` from `value` whenever that
 * happens, without clobbering a user's still-in-progress typing (typing
 * never changes `value` until it resolves to a real date, so this check
 * only fires on genuine external resets).
 */
export function DateInput({ value, onChange, placeholder, ...props }: DateInputProps) {
  const [text, setText] = useState(() => ymdToDisplay(value))
  const [lastValue, setLastValue] = useState(value)

  if (value !== lastValue) {
    setLastValue(value)
    setText(ymdToDisplay(value))
  }

  return (
    <Input
      placeholder={placeholder ?? 'dd/mm/yyyy'}
      inputMode="numeric"
      maxLength={10}
      value={text}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, '').slice(0, 8)
        const masked = formatDigits(digits)
        setText(masked)

        if (digits.length === 0) {
          setLastValue('')
          onChange('')
          return
        }
        if (digits.length === 8) {
          const ymd = parseDisplayDate(masked)
          if (ymd) {
            setLastValue(ymd)
            onChange(ymd)
          }
        }
      }}
      {...props}
    />
  )
}
