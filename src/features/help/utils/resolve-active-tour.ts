import { ROUTES } from '@/routes/route-paths'
import { TOUR_REGISTRY } from '@/features/help/config/tours'
import type { Tour } from '@/features/help/types/tour'

const PRODUCT_DETAIL_PATTERN = /^\/products\/[^/]+$/
const IMPORT_DETAIL_PATTERN = /^\/imports\/[^/]+$/

/**
 * Resolves which registered tour (if any) applies to "this screen" right
 * now — used by the floating Help button's "Hướng dẫn màn hình này" action.
 *
 * Deliberately route-only: Create/Edit Product is a `Dialog`, not a route,
 * and Radix marks everything outside a `Dialog`'s own portal `aria-hidden`
 * while it's open (correct modal accessibility behavior) — the floating
 * Help button genuinely cannot be reached through the accessibility tree
 * while a dialog has focus. That tour (`product-form`) is launched from a
 * small help icon inside the dialog's own header instead (see
 * `product-form-dialog.tsx`), never from here.
 */
export function resolveActiveTourId(pathname: string): string | null {
  if (pathname === ROUTES.products) return 'products-list'
  if (PRODUCT_DETAIL_PATTERN.test(pathname)) return 'product-detail'
  if (pathname === ROUTES.categories) return 'categories'
  if (pathname === ROUTES.suppliers) return 'suppliers'
  if (pathname === ROUTES.imports) return 'imports-list'
  if (IMPORT_DETAIL_PATTERN.test(pathname)) return 'import-receipt-detail'
  if (pathname === ROUTES.inventoryTransactions) return 'inventory-transactions'
  if (pathname === ROUTES.inventory) return 'inventory'
  if (pathname === ROUTES.reports) return 'reports'
  if (pathname === ROUTES.revenueReport) return 'revenue-report'
  return null
}

export function resolveActiveTour(pathname: string): Tour | null {
  const id = resolveActiveTourId(pathname)
  return id ? (TOUR_REGISTRY[id] ?? null) : null
}
