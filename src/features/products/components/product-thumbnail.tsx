import { Package } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Square product image with an icon fallback when there's no image (the
 * common case until the image-upload phase). Used in the list column and the
 * detail header.
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
  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted',
        className,
      )}
    >
      {url ? (
        <img src={url} alt={alt} className="size-full object-cover" loading="lazy" />
      ) : (
        <Package className="size-4 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  )
}
