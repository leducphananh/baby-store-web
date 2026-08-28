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
    minimumStock: product?.minimumStock ?? 0,
    status: product?.status ?? 'active',
  }
}

/** Same create/edit dialog pattern as `SupplierFormDialog`, larger body. */
export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
}) {
  const isEditMode = Boolean(product)
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
          <DialogTitle>{isEditMode ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Cập nhật thông tin sản phẩm "${product?.name}".`
              : 'Nhập thông tin để thêm sản phẩm mới vào danh mục.'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-9rem)] overflow-y-auto px-6 py-4">
          <ProductForm
            key={product?.id ?? 'create'}
            formId={FORM_ID}
            defaultValues={toDefaultValues(product)}
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
