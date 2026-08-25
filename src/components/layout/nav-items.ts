import type { ComponentType } from 'react'
import {
  AlertTriangle,
  BarChart3,
  FolderTree,
  LayoutDashboard,
  Package,
  PackagePlus,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react'

import { ROUTES } from '@/routes/route-paths'

export type NavItem = {
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
  /** Only "Tổng quan" (home) should match exactly, not as a prefix. */
  end?: boolean
}

/**
 * Single source of truth for sidebar + mobile-drawer navigation (see
 * `clean-code` — one list, rendered by both, not duplicated). Extend this
 * when a "Coming soon" module gets a real implementation — the path and
 * label stay the same, only the routed page changes (see
 * `src/app/router.tsx`).
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', path: ROUTES.home, icon: LayoutDashboard, end: true },
  { label: 'Danh mục', path: ROUTES.categories, icon: FolderTree },
  { label: 'Sản phẩm', path: ROUTES.products, icon: Package },
  { label: 'Nhà cung cấp', path: ROUTES.suppliers, icon: Truck },
  { label: 'Nhập hàng', path: ROUTES.imports, icon: PackagePlus },
  { label: 'Kho hàng', path: ROUTES.inventory, icon: Warehouse },
  { label: 'Khách hàng', path: ROUTES.customers, icon: Users },
  { label: 'Đơn hàng', path: ROUTES.orders, icon: ShoppingCart },
  { label: 'Báo cáo', path: ROUTES.reports, icon: BarChart3 },
  { label: 'Cảnh báo', path: ROUTES.alerts, icon: AlertTriangle },
  { label: 'Cài đặt', path: ROUTES.settings, icon: Settings },
]
