import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // shadcn/ui primitives and a few other files export a stable
      // constant (a `cva` variant map, a hook) alongside a component —
      // that's safe for Fast Refresh, so allow it instead of forcing an
      // artificial file split for every primitive.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Test files and test infrastructure are never Fast-Refreshed, so the
    // "only export components" rule (a HMR-DX rule) doesn't apply — a
    // `render.tsx` helper legitimately exports `renderWithProviders`, not a
    // component. This scopes that one rule off for test paths only; it is
    // not disabled anywhere else.
    files: ['src/test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
