import { forwardRef, useState } from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { formatDigits, parseDisplayDate, ymdToDisplay } from '@/components/common/date-input'

type MaskedDateInputProps = {
  name: string
  value: string
  disabled?: boolean
  autoFocus?: boolean
  onBlur: () => void
  onChangeValue: (value: string) => void
}

/**
 * The actual masked `<input>`. Takes plain primitives (not RHF's `field`
 * object) and forwards `ref` the standard React way, so `DateField` below
 * can read `field.name` / `field.ref` / `field.onBlur` directly the same
 * way `IntegerField` does, instead of threading the whole `field` object
 * through as a prop (which the React Compiler ESLint rule flags as an
 * unsafe ref read once any of its sibling properties get accessed too).
 *
 * Local `text` state holds the in-progress `dd/mm/yyyy` text — it's only
 * correct for as long as this instance stays mounted for one logical
 * field, so `DateField` is only safe where the surrounding form already
 * remounts per record: the import-receipt-line add panel and edit dialog
 * (Radix unmounts `DialogContent` on close), and `ImportReceiptForm` /
 * `PurchaseInvoiceForm`, whose dialogs `key` the form by record id. A form
 * that reused one mounted instance across different records without a
 * `key` would need `DateInput`'s external-reset handling instead.
 */
const MaskedDateInput = forwardRef<HTMLInputElement, MaskedDateInputProps>(
  function MaskedDateInput({ name, value, disabled, autoFocus, onBlur, onChangeValue }, ref) {
    const [text, setText] = useState(() => ymdToDisplay(value))

    return (
      <Input
        placeholder="dd/mm/yyyy"
        inputMode="numeric"
        maxLength={10}
        disabled={disabled}
        autoFocus={autoFocus}
        name={name}
        ref={ref}
        value={text}
        onBlur={onBlur}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, 8)
          const masked = formatDigits(digits)
          setText(masked)

          if (masked === '') {
            onChangeValue('')
            return
          }
          // Only a complete, real calendar date becomes the `YYYY-MM-DD`
          // the rest of the app expects (schema/API boundary,
          // `import-receipt-line-schema`). Anything shorter, or a
          // fully-typed but impossible date, is passed through as-is so
          // the shared Zod refine flags it as invalid rather than this
          // field silently going blank mid-type.
          onChangeValue(masked.length === 10 ? (parseDisplayDate(masked) ?? masked) : masked)
        }}
      />
    )
  },
)

/**
 * RHF-wired date input for any single-date form field backed by a plain
 * `YYYY-MM-DD` string (manufacture/expiry date, import date, invoice
 * date, ...) — keeps that same underlying value shape the surrounding Zod
 * schema and API already expect, but lets the user type it in Vietnamese
 * `dd/mm/yyyy` order (`vietnamese-business-ui`) instead of
 * `<input type="date">`, whose typed digit order follows the browser/OS
 * locale rather than this app's convention. For a date filter/range that
 * isn't backed by react-hook-form, use `DateInput` directly instead.
 */
export function DateField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  disabled,
  autoFocus,
}: {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  disabled?: boolean
  autoFocus?: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <MaskedDateInput
              name={field.name}
              value={typeof field.value === 'string' ? field.value : ''}
              disabled={disabled}
              autoFocus={autoFocus}
              onBlur={field.onBlur}
              onChangeValue={field.onChange}
              ref={field.ref}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
