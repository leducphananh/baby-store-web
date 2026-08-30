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
  /** Order detail — `orderDetail(id)` builds `/orders/<id>`. Not built yet
   *  (still a `ComingSoonPage` in the router); the path exists so purchase
   *  history can link to it now without a dead/placeholder href. */
  orderDetail: (id: string) => `/orders/${id}`,
  reports: '/reports',
  alerts: '/alerts',
  settings: '/settings',
  help: '/help',
} as const
