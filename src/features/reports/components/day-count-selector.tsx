import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/**
 * Generic "N ngày" selector shared by the expiry horizon and the slow-
 * moving sales lookback (Phase 7.6) — both are the same UI shape (a small
 * fixed set of day counts), and neither is a permanent business threshold:
 * this is always a REPORT FILTER the operator picks, never a hidden rule
 * baked into a component name (requirement §8/§21/§35). The label passed
 * in makes that framing explicit at each call site ("Hạn sử dụng trong" /
 * "Phân tích bán hàng trong"), never a bare number with no context.
 */
export function DayCountSelector<TValue extends number>({
  label,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  label: string
  value: TValue
  options: readonly TValue[]
  onChange: (value: TValue) => void
  ariaLabel: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Select value={String(value)} onValueChange={(next) => onChange(Number(next) as TValue)}>
        <SelectTrigger className="w-36" aria-label={ariaLabel}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option} ngày
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
