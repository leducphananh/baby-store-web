import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useProductImages } from '@/features/products/hooks/use-product-images'

/**
 * Product images from the private `product-images` bucket (signed URLs).
 * Uploading is a later phase, so no image is the normal case for now — the
 * empty state says so rather than showing placeholder pictures.
 */
export function ProductDetailImages({ productId }: { productId: string }) {
  const imagesQuery = useProductImages(productId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hình ảnh</CardTitle>
      </CardHeader>
      <CardContent>
        {imagesQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="aspect-square w-full rounded-md" />
            ))}
          </div>
        ) : imagesQuery.isError ? (
          <ErrorState
            message="Không thể tải hình ảnh sản phẩm."
            onRetry={() => void imagesQuery.refetch()}
          />
        ) : imagesQuery.data && imagesQuery.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {imagesQuery.data.map((image) => (
              <div key={image.id} className="relative overflow-hidden rounded-md border">
                <img
                  src={image.url}
                  alt="Hình ảnh sản phẩm"
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                {image.isPrimary && (
                  <Badge className="absolute top-1.5 left-1.5" variant="secondary">
                    Ảnh chính
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có hình ảnh"
            description="Tính năng tải ảnh sản phẩm sẽ được bổ sung ở giai đoạn sau."
          />
        )}
      </CardContent>
    </Card>
  )
}
