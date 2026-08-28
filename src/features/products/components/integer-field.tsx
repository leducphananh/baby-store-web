import type { Control } from 'react-hook-form'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { ProductFormValues } from '@/features/products/schemas/product-schema'

type IntegerFieldName = 'defaultPurchasePrice' | 'sellingPrice' | 'minimumStock'

/** Digits only; empty input becomes 0, capped to 15 digits. */
function parseIntegerInput(raw: string): number {
  const digits = raw.replace(/\D/g, '').slice(0, 15)
  return digits === '' ? 0 : Number(digits)
}

/**
 * RHF-wired integer input for the money and stock fields — keeps the form
 * value a real `number` (never a float, never a string) so the Zod
 * `.int()` checks and the API layer get exactly what they expect
 * (`react-hook-form-zod` rule 5). `<input type="text" inputMode="numeric">`
 * rather than `type="number"` to avoid locale/scroll/`e` quirks.
 */
export function IntegerField({
  control,
  name,
  label,
  description,
  disabled,
}: {
  control: Control<ProductFormValues>
  name: IntegerFieldName
  label: string
  description?: string
  disabled?: boolean
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
