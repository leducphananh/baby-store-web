/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Optional — see `src/lib/store-info.ts`. Only public display text (store name/address/phone/tax code) belongs here; never a secret. */
  readonly VITE_STORE_NAME?: string
  readonly VITE_STORE_ADDRESS?: string
  readonly VITE_STORE_PHONE?: string
  readonly VITE_STORE_TAX_CODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
