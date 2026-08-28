import { Badge } from '@/components/ui/badge'
import type { ProductStatus } from '@/features/products/types/product'

const LABELS: Record<ProductStatus, string> = {
  active: 'Đang kinh doanh',
  archived: 'Ngừng kinh doanh',
}

/** One place the product status → label/variant mapping lives (list + detail). */
export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge variant={status === 'active' ? 'default' : 'secondary'}>{LABELS[status]}</Badge>
  )
}
