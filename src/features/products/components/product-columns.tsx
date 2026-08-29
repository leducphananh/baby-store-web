import { Link } from 'react-router'
import { ArchiveRestore, ArchiveX, Copy, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DataTableColumn } from '@/components/common/data-table'
import { ROUTES } from '@/routes/route-paths'
import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'
import { formatUnitLabel } from '@/utils/unit'
import { ProductStatusBadge } from '@/features/products/components/product-status-badge'
import { ProductThumbnail } from '@/features/products/components/product-thumbnail'
import type { Product } from '@/features/products/types/product'

type ProductColumnActions = {
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onCopy: (product: Product) => void
  onToggleStatus: (product: Product) => void
  onDelete: (product: Product) => void
  /** Signed thumbnail URLs by product id, for the current page (see `getProducts`). */
  thumbnails: Map<string, string>
}

/**
 * Column definitions live in the feature, not the shared `DataTable` (see
 * `table-data-grid` rule 5). Money columns right-aligned; stock shows a
 * "Dưới định mức" badge when on-hand is at or below the product's minimum
 * (`domain-driven-frontend` rule 20). No mutation/dialog state here — the
 * page owns that and passes callbacks.
 */
export function getProductColumns({
  onView,
  onEdit,
  onCopy,
  onToggleStatus,
  onDelete,
  thumbnails,
}: ProductColumnActions): DataTableColumn<Product>[] {
  return [
    {
      id: 'image',
      header: 'Ảnh',
      cell: (product) => (
        <ProductThumbnail url={thumbnails.get(product.id)} alt={`Ảnh sản phẩm ${product.name}`} />
      ),
    },
    {
      id: 'name',
      header: 'Tên sản phẩm',
      sortable: true,
      cell: (product) => (
        <div className="flex flex-col">
          <Link
            to={ROUTES.productDetail(product.id)}
            className="font-medium text-foreground hover:underline"
          >
            {product.name}
          </Link>
          {product.brand && (
            <span className="text-xs text-muted-foreground">{product.brand}</span>
          )}
        </div>
      ),
    },
    {
      id: 'sku',
      header: 'SKU / Mã vạch',
      sortable: true,
      cell: (product) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs text-foreground">{product.sku}</span>
          {product.barcode && (
            <span className="font-mono text-xs text-muted-foreground">{product.barcode}</span>
          )}
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Danh mục',
      cell: (product) => (
        <span className="text-muted-foreground">{product.categoryName ?? '—'}</span>
      ),
    },
    {
      id: 'unit',
      header: 'Đơn vị bán',
      cell: (product) => <span className="text-muted-foreground">{formatUnitLabel(product.unit)}</span>,
    },
    {
      id: 'default_purchase_price',
      header: 'Giá nhập',
      sortable: true,
      align: 'right',
      cell: (product) => (
        <span className="whitespace-nowrap">
          {formatCurrencyVND(product.defaultPurchasePrice)}
          <span className="text-xs text-muted-foreground">/{formatUnitLabel(product.unit)}</span>
        </span>
      ),
    },
    {
      id: 'selling_price',
      header: 'Giá bán',
      sortable: true,
      align: 'right',
      cell: (product) => (
        <span className="whitespace-nowrap">
          {formatCurrencyVND(product.sellingPrice)}
          <span className="text-xs text-muted-foreground">/{formatUnitLabel(product.unit)}</span>
        </span>
      ),
    },
    {
      id: 'tiktok_price',
      header: 'Giá TikTok',
      sortable: true,
      align: 'right',
      cell: (product) =>
        product.tiktokPrice === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="whitespace-nowrap">
            {formatCurrencyVND(product.tiktokPrice)}
            <span className="text-xs text-muted-foreground">/{formatUnitLabel(product.unit)}</span>
          </span>
        ),
    },
    {
      id: 'shopee_price',
      header: 'Giá Shopee',
      sortable: true,
      align: 'right',
      cell: (product) =>
        product.shopeePrice === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="whitespace-nowrap">
            {formatCurrencyVND(product.shopeePrice)}
            <span className="text-xs text-muted-foreground">/{formatUnitLabel(product.unit)}</span>
          </span>
        ),
    },
    {
      id: 'stock',
      header: 'Tồn kho',
      align: 'right',
      cell: (product) => {
        const isLow = product.stockQuantity <= product.minimumStock
        return (
          <div className="flex items-center justify-end gap-2">
            <span className={isLow ? 'font-medium text-destructive' : undefined}>
              {formatNumber(product.stockQuantity)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {formatUnitLabel(product.unit)}
              </span>
            </span>
            {isLow && (
              <Badge variant="warning" className="font-normal">
                Dưới định mức
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (product) => <ProductStatusBadge status={product.status} />,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      align: 'right',
      cell: (product) => {
        const isActive = product.status === 'active'
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Thao tác với sản phẩm ${product.name}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(product)}>
                <Eye />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Pencil />
                Sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopy(product)}>
                <Copy />
                Nhân bản sản phẩm
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(product)}>
                {isActive ? <ArchiveX /> : <ArchiveRestore />}
                {isActive ? 'Ngừng kinh doanh' : 'Kinh doanh lại'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(product)}>
                <Trash2 />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
