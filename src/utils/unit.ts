import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'

/**
 * Shared formatting for a product's **base selling unit**.
 *
 * The database currently models packaging as one free-text `products.unit`
 * column (e.g. "Gói", "Hộp", "Lon") — there is no field for quantity-per-pack,
 * an inner unit, or net weight/volume, so those business cases (e.g.
 * "20 miếng / gói", "900 gram / hộp") can't be represented yet. Every
 * quantity in the system (stock, order lines, import lines, batches) is
 * counted in this one base unit.
 *
 * This is the single place that turns a `(quantity, unit)` pair into
 * user-facing text, so list, detail, and form stay consistent and no
 * component hand-builds `` `${n} ${unit}` `` itself (CLAUDE.md §8/§12).
 */

/** Shown when a product somehow has no unit set. */
const FALLBACK_UNIT = 'đơn vị'

/** The base selling unit as a clean display string, with a safe fallback. */
export function formatUnitLabel(unit: string | null | undefined): string {
  const trimmed = unit?.trim()
  return trimmed ? trimmed : FALLBACK_UNIT
}

/**
 * A quantity paired with its unit — `formatQuantityWithUnit(15, 'Gói')`
 * → `"15 Gói"`. Rounds via the shared number formatter (integers only).
 */
export function formatQuantityWithUnit(quantity: number, unit: string | null | undefined): string {
  return `${formatNumber(quantity)} ${formatUnitLabel(unit)}`
}

/**
 * A VND amount expressed per unit —
 * `formatPricePerUnit(255000, 'Gói')` → `"255.000 ₫/Gói"`.
 */
export function formatPricePerUnit(amountVnd: number, unit: string | null | undefined): string {
  return `${formatCurrencyVND(amountVnd)}/${formatUnitLabel(unit)}`
}
