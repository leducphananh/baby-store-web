import { Badge } from '@/components/ui/badge'

/**
 * One place the storefront-visibility → label/variant mapping lives (list +
 * detail) — mirrors `ProductStatusBadge`. Derived strictly from
 * `products.is_web_visible`, never inferred from stock/price/status (Admin
 * phase — storefront product publishing).
 */
export function ProductWebVisibilityBadge({ isWebVisible }: { isWebVisible: boolean }) {
  return (
    <Badge variant={isWebVisible ? 'success' : 'secondary'}>
      {isWebVisible ? 'Đang hiển thị' : 'Đang ẩn'}
    </Badge>
  )
}
