export type StoreInfo = {
  name: string
  address: string | null
  phone: string | null
  taxCode: string | null
}

/**
 * Optional store identity shown on the order PDF export header (Phase 6.6).
 * There is no `store_settings` table — this is static branding config, the
 * same category as the logo/app name already hardcoded in `index.html` and
 * `components/layout/sidebar.tsx`, not business data, so it stays out of the
 * database (CLAUDE.md §10).
 *
 * Reads plain, public `VITE_*` env vars (never a secret — see
 * `.env.example`). Returns `null` when `VITE_STORE_NAME` isn't set, so a PDF
 * generated without configuration simply omits the store-info block instead
 * of printing empty labels.
 */
export function getStoreInfo(): StoreInfo | null {
  const name = import.meta.env.VITE_STORE_NAME?.trim()
  if (!name) return null

  return {
    name,
    address: import.meta.env.VITE_STORE_ADDRESS?.trim() || null,
    phone: import.meta.env.VITE_STORE_PHONE?.trim() || null,
    taxCode: import.meta.env.VITE_STORE_TAX_CODE?.trim() || null,
  }
}
