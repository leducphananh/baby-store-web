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
  customers: '/customers',
  orders: '/orders',
  reports: '/reports',
  alerts: '/alerts',
  settings: '/settings',
} as const
