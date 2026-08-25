/**
 * Locale-aware integer formatter shared by currency and plain-number
 * display. Vietnamese grouping uses "." as the thousands separator
 * (e.g. 1.234.567), which `vi-VN` produces correctly.
 *
 * Never format numbers manually per component (string splitting/regex) —
 * always go through this utility so grouping stays consistent app-wide.
 */
const numberFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
})

/**
 * Format an integer with Vietnamese thousands separators.
 * Rounds to the nearest integer — this app never displays fractional
 * quantities/money, so a non-integer input signals a bug upstream.
 */
export function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value))
}
