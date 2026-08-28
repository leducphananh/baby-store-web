import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/utils/date'
import { formatUnitLabel } from '@/utils/unit'
import { DetailRow } from '@/components/common/detail-row'
import type { Product } from '@/features/products/types/product'

/** Basic info + category, and origin/sourcing — the non-pricing product facts. */
export function ProductDetailInfo({ product }: { product: Product }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow label="Tên sản phẩm" value={product.name} />
            <DetailRow label="Mã SKU" value={<span className="font-mono">{product.sku}</span>} />
            <DetailRow
              label="Mã vạch"
              value={product.barcode ? <span className="font-mono">{product.barcode}</span> : null}
            />
            <DetailRow label="Danh mục" value={product.categoryName} />
            <DetailRow label="Thương hiệu" value={product.brand} />
            <DetailRow label="Đơn vị bán" value={formatUnitLabel(product.unit)} />
            <DetailRow label="Mô tả" value={product.description} />
            <DetailRow
              label="Ngày tạo"
              value={product.createdAt ? formatDateTime(product.createdAt) : null}
            />
            <DetailRow
              label="Cập nhật gần nhất"
              value={product.updatedAt ? formatDateTime(product.updatedAt) : null}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nguồn gốc &amp; xuất xứ</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow label="Xuất xứ" value={product.originCountry} />
            <DetailRow label="Nhà sản xuất" value={product.manufacturer} />
            <DetailRow label="Nhà phân phối" value={product.distributor} />
            <DetailRow label="Mô tả nguồn hàng" value={product.sourceDescription} />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
