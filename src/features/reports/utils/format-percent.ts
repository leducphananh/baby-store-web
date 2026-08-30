/**
 * A safe division for a margin/growth-style ratio — `null` (not `Infinity`/
 * `NaN`) when `base` is 0, so a caller can render "—" instead of a
 * misleading number (see `formatPercent`).
 */
export function safeRatio(part: number, base: number): number | null {
  if (base === 0) return null
  return part / base
}

/**
 * Vietnamese-locale percentage for report metrics (margin, growth) —
 * `formatPercent(0.125)` → `"12,5%"`. `ratio` is a plain fraction (already
 * divided, `0.125` not `12.5`), typically the output of `safeRatio`. Never
 * renders `Infinity%`/`NaN%`: a non-finite or `null` ratio (e.g. a 0
 * denominator) renders `"—"` instead.
 */
export function formatPercent(ratio: number | null, fractionDigits = 1): string {
  if (ratio === null || !Number.isFinite(ratio)) return '—'
  return `${(ratio * 100).toLocaleString('vi-VN', { maximumFractionDigits: fractionDigits })}%`
}
