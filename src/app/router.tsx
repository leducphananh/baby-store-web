import { createBrowserRouter } from 'react-router'

import { AppShell } from '@/components/layout/app-shell'
import { HomePage } from '@/routes/home-page'
import { NotFoundPage } from '@/routes/not-found-page'

/**
 * App-wide router definition. Feature routes are added here as nested
 * children under `AppShell` as they're built (see `react-router` skill) —
 * route *page* components live in `src/routes/` and in each feature's
 * `components/`, this file only wires paths to them.
 *
 * Data loading stays in TanStack Query hooks inside route components, not
 * in router loaders/actions (see `react-query`, `react-router`).
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
