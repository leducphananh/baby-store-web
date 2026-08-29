import type { Control, FieldPath, FieldValues } from 'react-hook-form'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

/** Digits only; empty input becomes 0, capped to 15 digits. */
function parseIntegerInput(raw: string): number {
  const digits = raw.replace(/\D/g, '').slice(0, 15)
  return digits === '' ? 0 : Number(digits)
}

/**
 * RHF-wired integer input for money/quantity fields — keeps the form value a
 * real `number` (never a float, never a string) so `.int()` Zod checks and
 * the API layer get exactly what they expect (`react-hook-form-zod` rule 5,
 * `domain-driven-frontend` rule 1: VND/quantities are integers, period).
 * `<input type="text" inputMode="numeric">` rather than `type="number"` to
 * avoid locale/scroll/`e` quirks.
 *
 * Generic over the form's field values so it's reusable across features —
 * originally product-only (price/stock fields), now shared with import
 * receipt line items (quantity/purchase price). Promote a feature-local
 * component like this once a second real call site shows up, not before
 * (see `clean-code`).
 */
export function IntegerField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  autoFocus,
}: {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  description?: string
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
            <Input
              inputMode="numeric"
              disabled={disabled}
              autoFocus={autoFocus}
              name={field.name}
              ref={field.ref}
              value={String(field.value ?? 0)}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(parseIntegerInput(event.target.value))}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
