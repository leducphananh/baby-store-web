/**
 * Centralized route path constants. Use these instead of hardcoding path
 * strings in `<Link>`/`<NavLink>`/`navigate()` calls, so a path never has
 * to be updated in more than one place (see `clean-code`).
 *
 * Feature routes below `home` are currently wired to `ComingSoonPage`
 * placeholders (see `src/app/router.tsx`) — real feature pages replace
 * them one phase at a time without changing these paths or the sidebar.
 */
export const ROUTES = {
  login: '/login',
  home: '/',
  categories: '/categories',
  products: '/products',
  /** Product detail page — `productDetail(id)` builds `/products/<id>`. */
  productDetail: (id: string) => `/products/${id}`,
  suppliers: '/suppliers',
  imports: '/imports',
  /** Import receipt detail — `importDetail(id)` builds `/imports/<id>`. */
  importDetail: (id: string) => `/imports/${id}`,
  inventory: '/inventory',
  /** Inventory movement ledger. */
  inventoryTransactions: '/inventory/transactions',
  customers: '/customers',
  /** Customer detail page — `customerDetail(id)` builds `/customers/<id>`. */
  customerDetail: (id: string) => `/customers/${id}`,
  orders: '/orders',
  /** Create Order — the point-of-sale screen (Phase 6.2). */
  newOrder: '/orders/new',
  /** Order detail — `orderDetail(id)` builds `/orders/<id>`. */
  orderDetail: (id: string) => `/orders/${id}`,
  /** Edit Order — `editOrder(id)` builds `/orders/<id>/edit`. Only reachable
   *  for a `draft`/`confirmed` order (see `edit-order-page.tsx`). */
  editOrder: (id: string) => `/orders/${id}/edit`,
  reports: '/reports',
  /** Revenue Report (Phase 7.2) — completed-orders-only sales revenue over a selected period. */
  revenueReport: '/reports/revenue',
  /** Profit Report (Phase 7.3) — Gross Profit (Revenue - historical COGS) over a selected period. */
  profitReport: '/reports/profit',
  alerts: '/alerts',
  settings: '/settings',
  help: '/help',
} as const
