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
    <figure className="group overflow-hidden rounded-md border">
      <div className="relative">
        <img
          src={image.url}
          alt={image.isPrimary ? 'Ảnh chính của sản phẩm' : 'Ảnh sản phẩm'}
          className="aspect-square w-full object-cover"
          loading="lazy"
        />

        {image.isPrimary && (
          <Badge className="absolute left-1.5 top-1.5" variant="secondary">
            <Star className="size-3 fill-current" />
            Ảnh chính
          </Badge>
        )}

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute bottom-1.5 right-1.5 size-7 rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm transition-all hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={isBusy}
          onClick={onDelete}
          aria-label="Xóa ảnh này"
          title="Xóa ảnh"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <figcaption className="flex items-center justify-center border-t bg-muted/30 p-1.5">
        {image.isPrimary ? (
          <span className="text-xs font-medium text-primary">Ảnh chính</span>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs text-muted-foreground hover:text-primary"
            disabled={isBusy}
            onClick={onSetPrimary}
          >
            <Star className="shrink-0" />
            <span>Đặt ảnh chính</span>
          </Button>
        )}
      </figcaption>
    </figure>
  )
}
