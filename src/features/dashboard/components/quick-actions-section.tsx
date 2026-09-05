import { Link } from 'react-router'
import { PackagePlus, Plus, ShoppingCart, Warehouse } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/routes/route-paths'

/**
 * "Thao tác nhanh" — links only, to routes that already exist and already
 * host the real action (requirement §35/§74): creating a product/import
 * receipt/order is a form on that page itself, not a dashboard-specific
 * flow, so this only navigates there. Nothing here performs a mutation
 * (requirement §35/§75).
 */
export function QuickActionsSection() {
  return (
    <section data-tour="dashboard-quick-actions">
      <h2 className="mb-3 text-lg font-semibold text-foreground">Thao tác nhanh</h2>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to={ROUTES.newOrder}>
            <ShoppingCart />
            Tạo đơn hàng
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={ROUTES.products}>
            <Plus />
            Thêm sản phẩm
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={ROUTES.imports}>
            <PackagePlus />
            Tạo phiếu nhập
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={ROUTES.inventory}>
            <Warehouse />
            Xem tồn kho
          </Link>
        </Button>
      </div>
    </section>
  )
}
