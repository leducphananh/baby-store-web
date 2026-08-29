import { Package } from 'lucide-react'

import { ImagePreviewDialog } from '@/components/common/image-preview-dialog'
import { cn } from '@/lib/utils'

/**
 * Square product image with an icon fallback when there's no image (the
 * common case until the image-upload phase). Used in the list column and the
 * detail header.
 *
 * When there's a real image, the thumbnail is a button that opens the exact
 * same URL larger in `ImagePreviewDialog` — the list already has this signed
 * URL for the row (`getProducts`' thumbnail lookup), so no extra image query
 * happens on click. The icon fallback stays a plain, non-interactive div: a
 * product with no image must never look clickable (`table-data-grid`,
 * `accessibility`).
 */
export function ProductThumbnail({
  url,
  alt,
  className,
}: {
  url: string | null | undefined
  alt: string
  className?: string
}) {
  const frameClassName = cn(
    'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted',
    className,
  )

  if (!url) {
    return (
      <div className={frameClassName}>
        <Package className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  return (
    <ImagePreviewDialog url={url} alt={alt} title={alt}>
      <button
        type="button"
        className={cn(frameClassName, 'transition-opacity hover:opacity-80')}
        aria-label={`Xem ${alt}`}
        title="Xem ảnh"
      >
        <img src={url} alt={alt} className="size-full object-cover" loading="lazy" />
      </button>
    </ImagePreviewDialog>
  )
}
