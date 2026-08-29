import { useState, type ReactNode } from 'react'
import { ImageOff } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Lightweight image lightbox: wraps whatever trigger it's given (a
 * thumbnail button) and opens the same image larger in a centered `Dialog`
 * on click — no separate image query, no gallery/zoom, just "show this one
 * image bigger" (see `product-thumbnail.tsx`, its first use). Reuses the
 * existing `Dialog` primitive rather than a new lightbox dependency.
 *
 * The image never distorts (`object-contain`) and is capped to the
 * viewport (`max-w-[90vw] max-h-[80vh]`) regardless of its real
 * orientation/size. A skeleton covers the load, and a failed load shows a
 * plain Vietnamese message instead of a broken-image icon or a raw error.
 */
export function ImagePreviewDialog({
  url,
  alt,
  title,
  children,
}: {
  url: string
  alt: string
  title: string
  /** The trigger element (e.g. a thumbnail button) — rendered via `DialogTrigger asChild`. */
  children: ReactNode
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  return (
    <Dialog
      onOpenChange={(open) => {
        // Reset so re-opening (or opening a different row's dialog instance,
        // which remounts this component) always starts from a clean load state.
        if (open) setStatus('loading')
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[90vw] p-4 sm:max-w-[min(90vw,42rem)]">
        <DialogHeader>
          <DialogTitle className="truncate">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[80vh] items-center justify-center overflow-hidden rounded-md bg-muted">
          {status === 'error' ? (
            <div className="flex flex-col items-center gap-2 px-10 py-16 text-center text-sm text-muted-foreground">
              <ImageOff className="size-8" aria-hidden="true" />
              Không thể tải ảnh sản phẩm.
            </div>
          ) : (
            <>
              {status === 'loading' && <Skeleton className="aspect-square w-64 max-w-full" />}
              <img
                src={url}
                alt={alt}
                className={cn(
                  'max-h-[80vh] max-w-full object-contain',
                  status !== 'loaded' && 'hidden',
                )}
                onLoad={() => setStatus('loaded')}
                onError={() => setStatus('error')}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
