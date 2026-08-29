import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Star, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import {
  ACCEPTED_IMAGE_ACCEPT,
  ACCEPTED_IMAGE_LABEL,
  validateImageFile,
} from '@/features/products/utils/validate-image-file'

export type PendingProductImage = {
  id: string
  file: File
  previewUrl: string
  isPrimary: boolean
}

/** Revoke every preview URL still held — call on unmount and on explicit reset (Hủy/cancel). */
export function revokePendingProductImages(images: PendingProductImage[]): void {
  for (const image of images) URL.revokeObjectURL(image.previewUrl)
}

/**
 * Local-only equivalent of `ProductImagesManager`, for a product that
 * doesn't exist in the database yet (Create/"Nhân bản sản phẩm" — see
 * `product-form-dialog.tsx`). Selected files are validated with the exact
 * same `validateImageFile` used everywhere else, previewed via
 * `URL.createObjectURL`, and kept in memory only — **no Supabase Storage or
 * `product_images` call happens here**. `ProductFormDialog` uploads this
 * list for real (reusing `uploadProductImage`) only after the product has
 * actually been created, ordering the chosen primary first so the upload
 * function's own "first image becomes primary" rule does the right thing
 * without any special-cased upload path.
 *
 * State is controlled by the parent (not Zustand, not local-only) because
 * the parent needs the current file list at submit time.
 */
export function PendingProductImages({
  images,
  onImagesChange,
  disabled,
}: {
  images: PendingProductImage[]
  onImagesChange: (next: PendingProductImage[]) => void
  disabled?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rejections, setRejections] = useState<string[]>([])

  // Belt-and-suspenders: if this component itself unmounts while images are
  // still pending (shouldn't normally happen — the dialog owns the list and
  // revokes on close/submit — see `product-form-dialog.tsx`), don't leak.
  // The ref is kept in sync in its own effect (never written during render —
  // refs aren't for rendering) so the unmount cleanup below always sees the
  // latest list without re-subscribing on every change.
  const imagesRef = useRef(images)
  useEffect(() => {
    imagesRef.current = images
  })
  useEffect(() => () => revokePendingProductImages(imagesRef.current), [])

  async function handleFiles(files: File[]) {
    if (files.length === 0) return

    const accepted: File[] = []
    const nextRejections: string[] = []
    for (const file of files) {
      const result = await validateImageFile(file)
      if (result.ok) accepted.push(file)
      else nextRejections.push(result.message)
    }
    setRejections(nextRejections)
    if (accepted.length === 0) return

    const hasPrimaryAlready = images.some((image) => image.isPrimary)
    const added: PendingProductImage[] = accepted.map((file, index) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      // First image ever selected becomes primary by default — same
      // implicit rule `uploadProductImage` already applies for a real
      // product (`upload-product-image.ts`), just decided locally here.
      isPrimary: !hasPrimaryAlready && index === 0,
    }))
    onImagesChange([...images, ...added])
  }

  function openFilePicker() {
    setRejections([])
    fileInputRef.current?.click()
  }

  function removeImage(id: string) {
    const target = images.find((image) => image.id === id)
    if (!target) return
    URL.revokeObjectURL(target.previewUrl)

    const remaining = images.filter((image) => image.id !== id)
    if (target.isPrimary && remaining.length > 0 && !remaining.some((image) => image.isPrimary)) {
      remaining[0] = { ...remaining[0], isPrimary: true }
    }
    onImagesChange(remaining)
  }

  function setPrimary(id: string) {
    onImagesChange(images.map((image) => ({ ...image, isPrimary: image.id === id })))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ảnh sản phẩm</CardTitle>
        <p className="text-sm text-muted-foreground">
          {ACCEPTED_IMAGE_LABEL} · tối đa 5MB · nhiều ảnh, chọn một ảnh chính. Ảnh chỉ được tải lên
          sau khi sản phẩm được tạo thành công.
        </p>
        <CardAction>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_ACCEPT}
            multiple
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(event) => {
              const files = event.target.files ? Array.from(event.target.files) : []
              event.target.value = ''
              void handleFiles(files)
            }}
          />
          <Button type="button" variant="outline" onClick={openFilePicker} disabled={disabled}>
            <ImagePlus />
            Chọn ảnh
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-3">
        {rejections.length > 0 && (
          <div
            role="alert"
            className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {rejections.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>
        )}

        {images.length === 0 ? (
          <EmptyState
            icon={ImagePlus}
            title="Chưa chọn ảnh nào"
            description="Chọn ảnh để minh họa sản phẩm — ảnh sẽ được tải lên khi bạn lưu sản phẩm."
            action={
              <Button type="button" size="sm" variant="outline" onClick={openFilePicker} disabled={disabled}>
                <ImagePlus />
                Chọn ảnh
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image, index) => (
              <figure key={image.id} className="relative overflow-hidden rounded-md border">
                <img
                  src={image.previewUrl}
                  alt={image.isPrimary ? 'Ảnh chính của sản phẩm (chưa tải lên)' : 'Ảnh sản phẩm (chưa tải lên)'}
                  className="aspect-square w-full object-cover"
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
                      disabled={disabled}
                      onClick={() => setPrimary(image.id)}
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
                    disabled={disabled}
                    onClick={() => removeImage(image.id)}
                    aria-label={`Xóa ảnh ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
