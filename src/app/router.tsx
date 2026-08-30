import { createBrowserRouter } from 'react-router'

import { AppShell } from '@/components/layout/app-shell'
import { CategoriesPage } from '@/routes/categories-page'
import { ComingSoonPage } from '@/routes/coming-soon-page'
import { CreateOrderPage } from '@/routes/create-order-page'
import { CustomerDetailPage } from '@/routes/customer-detail-page'
import { CustomersPage } from '@/routes/customers-page'
import { EditOrderPage } from '@/routes/edit-order-page'
import { HelpCenterPage } from '@/routes/help-center-page'
import { HomePage } from '@/routes/home-page'
import { ImportReceiptDetailPage } from '@/routes/import-receipt-detail-page'
import { ImportsPage } from '@/routes/imports-page'
import { InventoryPage } from '@/routes/inventory-page'
import { InventoryTransactionsPage } from '@/routes/inventory-transactions-page'
import { LoginPage } from '@/routes/login-page'
import { NotFoundPage } from '@/routes/not-found-page'
import { OrderDetailPage } from '@/routes/order-detail-page'
import { OrdersPage } from '@/routes/orders-page'
import { ProductDetailPage } from '@/routes/product-detail-page'
import { ProductsPage } from '@/routes/products-page'
import { PublicOnlyRoute } from '@/routes/public-only-route'
import { RequireAuth } from '@/routes/require-auth'
import { ROUTES } from '@/routes/route-paths'
import { RouteErrorBoundary } from '@/routes/route-error-boundary'
import { SuppliersPage } from '@/routes/suppliers-page'

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
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'products', element: <ProductsPage /> },
          { path: 'products/:id', element: <ProductDetailPage /> },
          { path: 'suppliers', element: <SuppliersPage /> },
          { path: 'imports', element: <ImportsPage /> },
          { path: 'imports/:id', element: <ImportReceiptDetailPage /> },
          { path: 'inventory', element: <InventoryPage /> },
          { path: 'inventory/transactions', element: <InventoryTransactionsPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'customers/:id', element: <CustomerDetailPage /> },
          { path: 'orders', element: <OrdersPage /> },
          // Static segment declared before the `:id` dynamic route below,
          // same convention as `products`/`products/:id` — a literal path
          // always wins the match regardless of order, but this keeps
          // intent obvious on read.
          { path: 'orders/new', element: <CreateOrderPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
          { path: 'orders/:id/edit', element: <EditOrderPage /> },
          { path: 'reports', element: <ComingSoonPage title="Báo cáo" /> },
          { path: 'alerts', element: <ComingSoonPage title="Cảnh báo" /> },
          { path: 'settings', element: <ComingSoonPage title="Cài đặt" /> },
          { path: 'help', element: <HelpCenterPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
