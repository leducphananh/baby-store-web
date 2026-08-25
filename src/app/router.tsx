import { createBrowserRouter } from 'react-router'

import { AppShell } from '@/components/layout/app-shell'
import { ComingSoonPage } from '@/routes/coming-soon-page'
import { HomePage } from '@/routes/home-page'
import { LoginPage } from '@/routes/login-page'
import { NotFoundPage } from '@/routes/not-found-page'
import { PublicOnlyRoute } from '@/routes/public-only-route'
import { RequireAuth } from '@/routes/require-auth'
import { ROUTES } from '@/routes/route-paths'
import { RouteErrorBoundary } from '@/routes/route-error-boundary'

/**
 * App-wide router definition. `/login` is public (guarded the other way,
 * by `PublicOnlyRoute`); everything else sits under `RequireAuth` ->
 * `AppShell`. Feature routes are added here as they're built — most are
 * still `ComingSoonPage` placeholders per phase discipline (CLAUDE.md
 * §14) and the sidebar (`nav-items.ts`) already points at all of them, so
 * turning one on later is a one-line change here, not a new route.
 *
 * Data loading stays in TanStack Query hooks inside route components, not
 * in router loaders/actions (see `react-query`, `react-router`).
 */
export const router = createBrowserRouter([
  {
    path: ROUTES.login,
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: <RequireAuth />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'categories', element: <ComingSoonPage title="Danh mục" /> },
          { path: 'products', element: <ComingSoonPage title="Sản phẩm" /> },
          { path: 'suppliers', element: <ComingSoonPage title="Nhà cung cấp" /> },
          { path: 'imports', element: <ComingSoonPage title="Nhập hàng" /> },
          { path: 'inventory', element: <ComingSoonPage title="Kho hàng" /> },
          { path: 'customers', element: <ComingSoonPage title="Khách hàng" /> },
          { path: 'orders', element: <ComingSoonPage title="Đơn hàng" /> },
          { path: 'reports', element: <ComingSoonPage title="Báo cáo" /> },
          { path: 'alerts', element: <ComingSoonPage title="Cảnh báo" /> },
          { path: 'settings', element: <ComingSoonPage title="Cài đặt" /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
