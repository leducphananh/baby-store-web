import { ROUTES } from '@/routes/route-paths'

/**
 * `/products/:id#batches` — the product detail page scrolls to its batch
 * table for this hash (see `product-detail-page.tsx`). There is no
 * standalone batch detail route (a batch is always viewed in the context of
 * its product), so this is the one link every "go to this batch" affordance
 * in the app should use. Promoted here once a second real call site
 * (`OrderLinesCard`) needed the exact same link as
 * `inventory-overview-columns.tsx` (see `clean-code`).
 */
export function productBatchesHref(productId: string): string {
  return `${ROUTES.productDetail(productId)}#batches`
}
