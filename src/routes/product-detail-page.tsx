import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ArchiveRestore, ArchiveX, Copy, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import { ROUTES } from '@/routes/route-paths'
import { BackLink } from '@/components/common/back-link'
import { ProductDetailInfo } from '@/features/products/components/product-detail-info'
import { ProductDetailInventory } from '@/features/products/components/product-detail-inventory'
import { ProductDetailPricing } from '@/features/products/components/product-detail-pricing'
import { ProductFormDialog } from '@/features/products/components/product-form-dialog'
import { ProductImagesManager } from '@/features/products/components/product-images-manager'
import { ProductStatusBadge } from '@/features/products/components/product-status-badge'
import { useProduct } from '@/features/products/hooks/use-product'
import { useProductBatches } from '@/features/products/hooks/use-product-batches'
import { useProductImages } from '@/features/products/hooks/use-product-images'
import { useSetProductStatus } from '@/features/products/hooks/use-set-product-status'

function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const productQuery = useProduct(id)
  // Phase 9.8 (Debt A): start the batch + image requests now, from the route
  // param alone, so they run concurrently with useProduct instead of waiting
  // for it to resolve and the child cards to mount. ProductDetailInventory /
  // ProductImagesManager still own these hooks for display; TanStack Query
  // dedupes to one request per key, so the logical/network query count is
  // unchanged (2 → 2) — only mount timing.
  useProductBatches(id)
  useProductImages(id)
  const setProductStatus = useSetProductStatus()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCopyOpen, setIsCopyOpen] = useState(false)

  // Deep link from the Inventory Dashboard ("Xem lô hàng" — see
  // `inventory-overview-columns.tsx`): scroll the batch table into view once
  // the product has actually loaded and the section exists in the DOM.
  // Syncing scroll position to the URL hash has no declarative equivalent,
  // so a `useEffect` is the justified exception here (same category as
  // `useDebouncedValue`'s timer).
  useEffect(() => {
    if (location.hash !== '#batches' || !productQuery.data) return
    document.getElementById('batches')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash, productQuery.data])

  if (productQuery.isLoading) {
    return <PageLoading />
  }

  if (productQuery.isError) {
    return (
      <PageContent>
        <BackLink to={ROUTES.products} label="Danh sách sản phẩm" />
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
        <BackLink to={ROUTES.products} label="Danh sách sản phẩm" />
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
      <BackLink to={ROUTES.products} label="Danh sách sản phẩm" />

      <PageHeader
        title={product.name}
        description={`SKU: ${product.sku}`}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-tour="product-detail-header">
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
            <Button variant="outline" onClick={() => setIsCopyOpen(true)}>
              <Copy />
              Nhân bản sản phẩm
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
      <div data-tour="product-detail-pricing">
        <ProductDetailPricing product={product} />
      </div>
      <div id="batches" className="scroll-mt-20" data-tour="product-detail-inventory">
        <ProductDetailInventory product={product} />
      </div>
      <div data-tour="product-detail-images">
        <ProductImagesManager productId={product.id} />
      </div>

      <ProductFormDialog open={isEditOpen} onOpenChange={setIsEditOpen} product={product} />
      <ProductFormDialog open={isCopyOpen} onOpenChange={setIsCopyOpen} copyFrom={product} />
    </PageContent>
  )
}

export { ProductDetailPage }
