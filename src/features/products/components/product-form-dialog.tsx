import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { UseFormReturn } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { productKeys } from '@/features/products/api/query-keys'
import { uploadProductImage } from '@/features/products/api/upload-product-image'
import { ProductForm } from '@/features/products/components/product-form'
import { ProductImagesManager } from '@/features/products/components/product-images-manager'
import {
  PendingProductImages,
  revokePendingProductImages,
  type PendingProductImage,
} from '@/features/products/components/pending-product-images'
import { useCreateProduct } from '@/features/products/hooks/use-create-product'
import { useUpdateProduct } from '@/features/products/hooks/use-update-product'
import type { ProductFormValues } from '@/features/products/schemas/product-schema'
import type { Product } from '@/features/products/types/product'
import { getProductUniqueField } from '@/features/products/utils/get-product-error-message'

const FORM_ID = 'product-form'

function toDefaultValues(product?: Product): ProductFormValues {
  return {
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    categoryId: product?.categoryId ?? '',
    brand: product?.brand ?? '',
    unit: product?.unit ?? '',
    description: product?.description ?? '',
    originCountry: product?.originCountry ?? '',
    manufacturer: product?.manufacturer ?? '',
    distributor: product?.distributor ?? '',
    sourceDescription: product?.sourceDescription ?? '',
    defaultPurchasePrice: product?.defaultPurchasePrice ?? 0,
    sellingPrice: product?.sellingPrice ?? 0,
    tiktokPrice: product?.tiktokPrice ?? null,
    shopeePrice: product?.shopeePrice ?? null,
    minimumStock: product?.minimumStock ?? 0,
    status: product?.status ?? 'active',
  }
}

/**
 * Default values for "create from a copy" (see `product-columns.tsx`'s
 * "Nhân bản sản phẩm" action): reuses `toDefaultValues` for every reusable
 * field, then clears/resets exactly the fields a copy must never inherit —
 * `sku`/`barcode` are UNIQUE in the database, and a fresh copy starts
 * `active` regardless of the source product's status. Deliberately does NOT
 * touch images, inventory, batches, or historical relationships — those
 * aren't part of the form at all, and the copy's pending-images list always
 * starts empty (see `PendingProductImages`) regardless of what the source
 * product has.
 */
function toCopyDefaultValues(source: Product): ProductFormValues {
  return {
    ...toDefaultValues(source),
    sku: '',
    barcode: '',
    status: 'active',
  }
}

/**
 * Same create/edit dialog pattern as `SupplierFormDialog`, larger body.
 *
 * A third mode layers on top of create/edit: passing `copyFrom` (with no
 * `product`) prefills the form from an existing product but still submits
 * through `createProduct` — it's the create flow with different starting
 * values and copy-specific title/description text, never edit mode (see
 * `product-columns.tsx`'s "Nhân bản sản phẩm" action and the product detail
 * page's equivalent button).
 *
 * Image management is now available directly in this dialog for every mode:
 * - Edit mode renders the exact same `ProductImagesManager` used on Product
 *   Detail — the product already has a real id, so uploads/deletes/primary
 *   changes are immediate, unchanged from how Product Detail always worked.
 * - Create/copy mode has no product id yet, so it renders
 *   `PendingProductImages` instead: files are validated and previewed
 *   locally only. Nothing is uploaded to Storage until `createProduct`
 *   actually resolves — see `handleCreateSubmit` below for the exact
 *   create → upload sequencing and partial-failure handling.
 */
export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  copyFrom,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
  copyFrom?: Product
}) {
  const isEditMode = Boolean(product)
  const isCopyMode = !product && Boolean(copyFrom)
  const queryClient = useQueryClient()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const [pendingImages, setPendingImages] = useState<PendingProductImage[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  const isSubmitting = createProduct.isPending || updateProduct.isPending || isUploadingImages

  function resetPendingImages() {
    revokePendingProductImages(pendingImages)
    setPendingImages([])
  }

  /**
   * Guards every way the dialog can close (Hủy button, the header's X,
   * Escape, outside click — see the `Dialog`/`onCloseAutoFocus` usage
   * below) through one place: never let the dialog close mid-submission
   * (CLAUDE.md §11 duplicate-submission rule extended to "don't let the
   * user yank the dialog away while a product/upload is in flight"), and
   * always revoke pending preview URLs when it closes for real — this is
   * what makes "cancel create" leave zero permanent Storage/DB residue
   * (task §15): nothing was ever uploaded, so there's nothing to undo.
   */
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      if (isSubmitting) return
      resetPendingImages()
    }
    onOpenChange(nextOpen)
  }

  /** Sequential, same pattern as `ProductImagesManager`'s own upload loop — clear per-file failure isolation. */
  async function uploadPendingImages(
    productId: string,
    images: PendingProductImage[],
  ): Promise<{ succeeded: number; failed: number }> {
    // Upload the user's chosen primary first so `uploadProductImage`'s own
    // "first image for this product becomes primary" rule (see
    // `upload-product-image.ts`) makes it primary too — no separate
    // "set primary" call needed, and no second primary-image rule to keep
    // in sync with the real one.
    const ordered = [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))

    let succeeded = 0
    let failed = 0
    for (const image of ordered) {
      try {
        await uploadProductImage({ productId, file: image.file })
        succeeded += 1
      } catch {
        failed += 1
      }
    }
    return { succeeded, failed }
  }

  async function handleCreateSubmit(
    values: ProductFormValues,
    form: UseFormReturn<ProductFormValues>,
  ) {
    let created: { id: string }
    try {
      created = await createProduct.mutateAsync(values)
    } catch (error) {
      // Duplicate SKU/barcode: surface it inline on the offending field, not
      // just as a toast (see `react-hook-form-zod` rule 7). The mutation
      // hook itself already showed the toast. Nothing was created, so there
      // is nothing to reconcile — the user just fixes the field and retries.
      const field = getProductUniqueField(error)
      if (field) {
        form.setError(field, {
          type: 'server',
          message: field === 'barcode' ? 'Mã vạch đã tồn tại' : 'Mã SKU đã tồn tại',
        })
      }
      return
    }

    // The product now exists for real. From this point on we NEVER retry
    // `createProduct` — an image-upload failure must not look like the
    // whole operation failed, and must not risk a duplicate product
    // (CLAUDE.md §11 data integrity; task §6).
    const imagesToUpload = pendingImages
    if (imagesToUpload.length > 0) {
      setIsUploadingImages(true)
      const { succeeded, failed } = await uploadPendingImages(created.id, imagesToUpload)
      setIsUploadingImages(false)

      if (succeeded > 0) {
        void queryClient.invalidateQueries({ queryKey: productKeys.images(created.id) })
        void queryClient.invalidateQueries({ queryKey: productKeys.detail(created.id) })
        // Re-invalidate the list a second time: `useCreateProduct`'s own
        // `onSuccess` already invalidated it right after creation, before
        // any image existed, so the new row's thumbnail wasn't in yet.
        void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      }
      if (failed > 0) {
        toast.warning(
          succeeded > 0
            ? `Sản phẩm đã được tạo, nhưng ${failed} ảnh tải lên không thành công. Bạn có thể thử tải lại ảnh trong màn chỉnh sửa sản phẩm.`
            : 'Sản phẩm đã được tạo, nhưng ảnh tải lên không thành công. Bạn có thể thử tải lại ảnh trong màn chỉnh sửa sản phẩm.',
        )
      }
    }

    revokePendingProductImages(imagesToUpload)
    setPendingImages([])
    onOpenChange(false)
  }

  function handleSubmit(values: ProductFormValues, form: UseFormReturn<ProductFormValues>) {
    if (product) {
      const onError = (error: unknown) => {
        const field = getProductUniqueField(error)
        if (field) {
          form.setError(field, {
            type: 'server',
            message: field === 'barcode' ? 'Mã vạch đã tồn tại' : 'Mã SKU đã tồn tại',
          })
        }
      }
      updateProduct.mutate({ id: product.id, values }, { onSuccess: () => onOpenChange(false), onError })
      return
    }

    void handleCreateSubmit(values, form)
  }

  const submitLabel = isEditMode
    ? updateProduct.isPending
      ? 'Đang lưu...'
      : 'Lưu thay đổi'
    : createProduct.isPending
      ? 'Đang tạo sản phẩm...'
      : isUploadingImages
        ? 'Đang tải ảnh...'
        : 'Thêm sản phẩm'

  const imagesSection = product ? (
    <ProductImagesManager productId={product.id} />
  ) : (
    <PendingProductImages images={pendingImages} onImagesChange={setPendingImages} disabled={isSubmitting} />
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>
            {isEditMode ? 'Sửa sản phẩm' : isCopyMode ? 'Tạo sản phẩm từ bản sao' : 'Thêm sản phẩm'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Cập nhật thông tin sản phẩm "${product?.name}".`
              : isCopyMode
                ? `Thông tin được sao chép từ sản phẩm "${copyFrom?.name}". Hãy kiểm tra và chỉnh sửa trước khi lưu.`
                : 'Nhập thông tin để thêm sản phẩm mới vào danh mục.'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-9rem)] overflow-y-auto px-6 py-4">
          <ProductForm
            key={product?.id ?? (copyFrom ? `copy-${copyFrom.id}` : 'create')}
            formId={FORM_ID}
            defaultValues={product ? toDefaultValues(product) : copyFrom ? toCopyDefaultValues(copyFrom) : toDefaultValues()}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            imagesSection={imagesSection}
          />
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
