import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Test-only Vite/Vitest config. Vitest picks this up in preference to
 * `vite.config.ts`, so `vite dev` / `vite build` are untouched.
 *
 * Deliberately a small standalone config rather than `mergeConfig(viteConfig,
 * ...)`: the app build's `@rolldown/plugin-babel` (React Compiler) pass and
 * the Tailwind plugin are build-time concerns with no value in jsdom unit/
 * component tests — tests assert behaviour, not compiler output or real CSS.
 * Only `@vitejs/plugin-react` (JSX transform) and the `@/` alias are shared,
 * and the alias is one line, not a dependency.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    // jsdom, chosen over happy-dom for closer spec fidelity (Radix/RTL).
    environment: 'jsdom',
    // Explicit `import { describe, it, expect, vi } from 'vitest'` in every
    // test — no ambient global type pollution, clearer files.
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Per-test isolation: wipe recorded mock calls before each test, and
    // restore anything `vi.spyOn`-ed (so a local `console.error` spy can't
    // leak). NOT `mockReset` — that would also wipe implementations set once
    // at file scope by `vi.mock` factories.
    clearMocks: true,
    restoreMocks: true,
    css: false,
    // Deterministic, obviously-fake public env so that if a test ever
    // transitively imports the real `@/lib/supabase` (which throws on a
    // missing URL/key at import time) it fails loudly on a real call, not on
    // module load. No test actually uses the real client — the Supabase
    // boundary is always mocked. Never a real credential.
    env: {
      VITE_SUPABASE_URL: 'https://stub.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'stub-anon-key-not-a-real-credential',
    },
  },
})
