import { Star, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ProductImage } from '@/features/products/types/product'

/**
 * One uploaded image in the manager grid, with its actions. Action buttons
 * are always visible (not hover-only) so they stay keyboard- and
 * touch-reachable (see `accessibility`).
 */
export function ProductImageTile({
  image,
  isBusy,
  onSetPrimary,
  onDelete,
}: {
  image: ProductImage
  isBusy: boolean
  onSetPrimary: () => void
  onDelete: () => void
}) {
  return (
    <figure className="group relative overflow-hidden rounded-md border">
      <img
        src={image.url}
        alt={image.isPrimary ? 'Ảnh chính của sản phẩm' : 'Ảnh sản phẩm'}
        className="aspect-square w-full object-cover"
        loading="lazy"
      />

      {image.isPrimary && (
        <Badge className="absolute top-1.5 left-1.5" variant="secondary">
          <Star className="size-3 fill-current" />
          Ảnh chính
        </Badge>
      )}

      <figcaption className="flex items-center justify-between gap-2 border-t bg-background/95 px-2 py-1.5">
        {image.isPrimary ? (
          <span className="text-xs text-muted-foreground">Đang là ảnh chính</span>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={isBusy}
            onClick={onSetPrimary}
          >
            <Star className="size-3.5" />
            Đặt ảnh chính
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          disabled={isBusy}
          onClick={onDelete}
          aria-label="Xóa ảnh này"
        >
          <Trash2 className="size-4" />
        </Button>
      </figcaption>
    </figure>
  )
}
