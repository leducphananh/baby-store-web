/**
 * Centralized route path constants. Use these instead of hardcoding path
 * strings in `<Link>`/`navigate()` calls, so a path never has to be updated
 * in more than one place (see `clean-code`).
 *
 * Extend this object as real feature routes are added — one entry per
 * route, grouped by feature once features exist (e.g.
 * `ROUTES.products.list`, `ROUTES.products.detail(id)`).
 */
export const ROUTES = {
  home: '/',
} as const
