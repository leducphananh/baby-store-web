import { formatNumber } from '@/utils/number'

/**
 * Format an integer VND amount for display, e.g. `formatCurrencyVND(125000)`
 * → `"125.000 ₫"`.
 *
 * Money in this app is always an integer VND value — never a float. This is
 * the one shared place that turns that integer into user-facing text; no
 * component should format currency manually (see CLAUDE.md §8,
 * `vietnamese-business-ui`, `domain-driven-frontend`).
 */
export function formatCurrencyVND(amountVnd: number): string {
  return `${formatNumber(amountVnd)} ₫`
}
