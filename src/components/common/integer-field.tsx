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

type IntegerFieldBaseProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  description?: string
  disabled?: boolean
  autoFocus?: boolean
}

/**
 * Shared render logic for `IntegerField`/`NullableIntegerField` — same
 * `<input type="text" inputMode="numeric">` markup either way (see
 * `IntegerField`'s own doc comment for why not `type="number"`); only what
 * an empty input becomes differs, via `allowNull`.
 */
function IntegerFieldBase<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  autoFocus,
  allowNull,
}: IntegerFieldBaseProps<TFieldValues> & { allowNull: boolean }) {
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
              value={field.value == null ? '' : String(field.value)}
              onBlur={field.onBlur}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').slice(0, 15)
                field.onChange(digits === '' ? (allowNull ? null : 0) : Number(digits))
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/**
 * RHF-wired integer input for money/quantity fields — keeps the form value a
 * real `number` (never a float, never a string) so `.int()` Zod checks and
 * the API layer get exactly what they expect (`react-hook-form-zod` rule 5,
 * `domain-driven-frontend` rule 1: VND/quantities are integers, period).
 * `<input type="text" inputMode="numeric">` rather than `type="number"` to
 * avoid locale/scroll/`e` quirks. Empty input becomes `0` — use this for
 * fields that are always meaningful as a number (never "unset").
 *
 * Generic over the form's field values so it's reusable across features —
 * originally product-only (price/stock fields), now shared with import
 * receipt line items (quantity/purchase price). Promote a feature-local
 * component like this once a second real call site shows up, not before
 * (see `clean-code`).
 */
export function IntegerField<TFieldValues extends FieldValues>(
  props: IntegerFieldBaseProps<TFieldValues>,
) {
  return <IntegerFieldBase {...props} allowNull={false} />
}

/**
 * Same as `IntegerField`, but for optional numeric fields where "empty"
 * carries real meaning distinct from `0` (e.g. a product's TikTok/Shopee
 * price before it's listed on that channel) — empty input becomes `null`
 * instead of `0`, so the two are never silently conflated (CLAUDE.md §8).
 * Shares `IntegerFieldBase` rather than duplicating the input markup.
 */
export function NullableIntegerField<TFieldValues extends FieldValues>(
  props: IntegerFieldBaseProps<TFieldValues>,
) {
  return <IntegerFieldBase {...props} allowNull={true} />
}
