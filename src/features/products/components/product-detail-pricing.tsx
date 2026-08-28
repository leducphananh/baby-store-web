import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import { DetailRow } from '@/features/products/components/detail-row'
import type { Product } from '@/features/products/types/product'

/**
 * The product's *configured* pricing. The "Chênh lệch giá niêm yết" line is
 * `selling_price − default_purchase_price` on the current record — a catalog
 * setup figure, explicitly not realized profit (that comes from actual
 * order-item price vs. batch COGS — see `domain-driven-frontend` rule 18).
 */
export function ProductDetailPricing({ product }: { product: Product }) {
  const priceGap = product.sellingPrice - product.defaultPurchasePrice

  return (
    <Card>
      <CardHeader>
        <CardTitle>Giá &amp; định mức</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          <DetailRow
            label="Giá nhập mặc định"
            value={formatCurrencyVND(product.defaultPurchasePrice)}
          />
          <DetailRow label="Giá bán" value={formatCurrencyVND(product.sellingPrice)} />
          <DetailRow
            label="Chênh lệch giá niêm yết"
            value={
              <span className={priceGap < 0 ? 'text-destructive' : undefined}>
                {formatCurrencyVND(priceGap)}
              </span>
            }
          />
          <DetailRow
            label="Tồn kho tối thiểu"
            value={`${formatNumber(product.minimumStock)} ${product.unit}`}
          />
        </dl>
      </CardContent>
    </Card>
  )
}
