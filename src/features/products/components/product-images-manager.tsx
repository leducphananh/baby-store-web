import { useRef, useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { ProductImageTile } from '@/features/products/components/product-image-tile'
import { useDeleteProductImage } from '@/features/products/hooks/use-delete-product-image'
import { useProductImages } from '@/features/products/hooks/use-product-images'
import { useSetPrimaryProductImage } from '@/features/products/hooks/use-set-primary-product-image'
import { useUploadProductImage } from '@/features/products/hooks/use-upload-product-image'
import type { ProductImage } from '@/features/products/types/product'
import {
  ACCEPTED_IMAGE_ACCEPT,
  ACCEPTED_IMAGE_LABEL,
  validateImageFile,
} from '@/features/products/utils/validate-image-file'

type PendingUpload = { id: string; name: string; previewUrl: string }

/**
 * Full image gallery + upload/remove/set-primary manager for the product
 * detail page. Validation runs on selection (before any network call);
 * uploads run sequentially with a per-file preview + spinner; every
 * destructive action is confirmed.
 */
export function ProductImagesManager({ productId }: { productId: string }) {
  const imagesQuery = useProductImages(productId)
  const uploadImage = useUploadProductImage(productId)
  const deleteImage = useDeleteProductImage(productId)
  const setPrimary = useSetPrimaryProductImage(productId)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [rejections, setRejections] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<ProductImage | null>(null)

  const isMutatingImage = deleteImage.isPending || setPrimary.isPending

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

    setIsUploading(true)
    let uploaded = 0
    for (const file of accepted) {
      const previewUrl = URL.createObjectURL(file)
      const id = crypto.randomUUID()
      setPending((current) => [...current, { id, name: file.name, previewUrl }])
      try {
        await uploadImage.mutateAsync(file)
        uploaded += 1
      } catch {
        // useUploadProductImage already surfaced the error as a toast.
      } finally {
        setPending((current) => current.filter((item) => item.id !== id))
        URL.revokeObjectURL(previewUrl)
      }
    }
    setIsUploading(false)
    if (uploaded > 0) {
      toast.success(uploaded === 1 ? 'Đã tải lên 1 ảnh' : `Đã tải lên ${uploaded} ảnh`)
    }
  }

  function openFilePicker() {
    setRejections([])
    fileInputRef.current?.click()
  }

  const images = imagesQuery.data ?? []
  const showEmpty =
    !imagesQuery.isLoading && !imagesQuery.isError && images.length === 0 && pending.length === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ảnh sản phẩm</CardTitle>
        <p className="text-sm text-muted-foreground">
          {ACCEPTED_IMAGE_LABEL} · tối đa 5MB · nhiều ảnh, chọn một ảnh chính
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
              // Copy out of the live FileList before clearing `value` (which
              // also empties `event.target.files`); clearing lets the same
              // file be picked again later.
              const files = event.target.files ? Array.from(event.target.files) : []
              event.target.value = ''
              void handleFiles(files)
            }}
          />
          <Button type="button" onClick={openFilePicker} disabled={isUploading}>
            {isUploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {isUploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
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

        {imagesQuery.isError ? (
          <ErrorState
            message="Không thể tải hình ảnh sản phẩm."
            onRetry={() => void imagesQuery.refetch()}
          />
        ) : imagesQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="aspect-square w-full rounded-md" />
            ))}
          </div>
        ) : showEmpty ? (
          <EmptyState
            icon={ImagePlus}
            title="Chưa có hình ảnh"
            description="Tải ảnh lên để minh họa sản phẩm trong danh sách và trang chi tiết."
            action={
              <Button size="sm" variant="outline" onClick={openFilePicker} disabled={isUploading}>
                <ImagePlus />
                Tải ảnh lên
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pending.map((item) => (
              <div
                key={item.id}
                role="img"
                aria-label={`Đang tải lên ${item.name}`}
                className="relative overflow-hidden rounded-md border"
              >
                <img
                  src={item.previewUrl}
                  alt=""
                  className="aspect-square w-full object-cover opacity-40"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-foreground" />
                </div>
              </div>
            ))}

            {images.map((image) => (
              <ProductImageTile
                key={image.id}
                image={image}
                isBusy={isMutatingImage || isUploading}
                onSetPrimary={() => setPrimary.mutate(image.id)}
                onDelete={() => setDeleteTarget(image)}
              />
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa ảnh"
        description="Xóa ảnh này khỏi sản phẩm? Ảnh sẽ bị xóa khỏi kho lưu trữ và không thể khôi phục."
        confirmLabel="Xóa"
        variant="destructive"
        isConfirming={deleteImage.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteImage.mutate(
            { id: deleteTarget.id, storagePath: deleteTarget.storagePath, isPrimary: deleteTarget.isPrimary },
            { onSettled: () => setDeleteTarget(null) },
          )
        }}
      />
    </Card>
  )
}
