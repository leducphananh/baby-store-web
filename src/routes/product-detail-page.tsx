import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArchiveRestore, ArchiveX, ArrowLeft, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import { ROUTES } from '@/routes/route-paths'
import { ProductDetailInfo } from '@/features/products/components/product-detail-info'
import { ProductDetailInventory } from '@/features/products/components/product-detail-inventory'
import { ProductDetailPricing } from '@/features/products/components/product-detail-pricing'
import { ProductFormDialog } from '@/features/products/components/product-form-dialog'
import { ProductImagesManager } from '@/features/products/components/product-images-manager'
import { ProductStatusBadge } from '@/features/products/components/product-status-badge'
import { useProduct } from '@/features/products/hooks/use-product'
import { useSetProductStatus } from '@/features/products/hooks/use-set-product-status'

function BackLink() {
  return (
    <Link
      to={ROUTES.products}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Danh sách sản phẩm
    </Link>
  )
}

function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productQuery = useProduct(id)
  const setProductStatus = useSetProductStatus()
  const [isEditOpen, setIsEditOpen] = useState(false)

  if (productQuery.isLoading) {
    return <PageLoading />
  }

  if (productQuery.isError) {
    return (
      <PageContent>
        <BackLink />
        <ErrorState
          message="Không thể tải thông tin sản phẩm. Vui lòng thử lại."
          onRetry={() => void productQuery.refetch()}
        />
      </PageContent>
    )
  }

  const product = productQuery.data
  if (!product) {
    return (
      <PageContent>
        <BackLink />
        <EmptyState
          title="Không tìm thấy sản phẩm"
          description="Sản phẩm này có thể đã bị xóa hoặc đường dẫn không đúng."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES.products}>Về danh sách sản phẩm</Link>
            </Button>
          }
        />
      </PageContent>
    )
  }

  const isActive = product.status === 'active'

  return (
    <PageContent>
      <BackLink />

      <PageHeader
        title={product.name}
        description={`SKU: ${product.sku}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={setProductStatus.isPending}
              onClick={() =>
                setProductStatus.mutate({
                  id: product.id,
                  status: isActive ? 'archived' : 'active',
                })
              }
            >
              {isActive ? <ArchiveX /> : <ArchiveRestore />}
              {isActive ? 'Ngừng kinh doanh' : 'Kinh doanh lại'}
            </Button>
            <Button onClick={() => setIsEditOpen(true)}>
              <Pencil />
              Sửa
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <ProductStatusBadge status={product.status} />
        {product.categoryName && <span>· {product.categoryName}</span>}
        {product.brand && <span>· {product.brand}</span>}
      </div>

      <ProductDetailInfo product={product} />
      <ProductDetailPricing product={product} />
      <ProductDetailInventory product={product} />
      <ProductImagesManager productId={product.id} />

      <ProductFormDialog open={isEditOpen} onOpenChange={setIsEditOpen} product={product} />
    </PageContent>
  )
}

export { ProductDetailPage }
