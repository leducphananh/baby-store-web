import { Link } from 'react-router'
import type { UseFormReturn } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/routes/route-paths'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProductForm } from '@/features/products/components/product-form'
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
 * aren't part of the form at all.
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
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const isSubmitting = createProduct.isPending || updateProduct.isPending

  function handleSubmit(values: ProductFormValues, form: UseFormReturn<ProductFormValues>) {
    const onError = (error: unknown) => {
      // Duplicate SKU/barcode: surface it inline on the offending field, not
      // just as a toast (see `react-hook-form-zod` rule 7). The mutation
      // hook still shows the toast.
      const field = getProductUniqueField(error)
      if (field) {
        form.setError(field, {
          type: 'server',
          message: field === 'barcode' ? 'Mã vạch đã tồn tại' : 'Mã SKU đã tồn tại',
        })
      }
    }

    if (product) {
      updateProduct.mutate(
        { id: product.id, values },
        { onSuccess: () => onOpenChange(false), onError },
      )
    } else {
      createProduct.mutate(values, { onSuccess: () => onOpenChange(false), onError })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          />

          {product && (
            <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">
              Hình ảnh sản phẩm được quản lý ở{' '}
              <Link
                to={ROUTES.productDetail(product.id)}
                className="font-medium text-foreground underline underline-offset-4"
                onClick={() => onOpenChange(false)}
              >
                trang chi tiết
              </Link>
              .
            </p>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
