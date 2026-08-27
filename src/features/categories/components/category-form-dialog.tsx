import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CategoryForm } from '@/features/categories/components/category-form'
import { useCreateCategory } from '@/features/categories/hooks/use-create-category'
import { useUpdateCategory } from '@/features/categories/hooks/use-update-category'
import type { CategoryFormValues } from '@/features/categories/schemas/category-schema'
import type { Category } from '@/features/categories/types/category'

const FORM_ID = 'category-form'

/**
 * One dialog for both add and edit — `category` present means edit mode
 * (see `react-hook-form-zod`: reuse the form, don't duplicate create/edit
 * UI). The parent page owns `open` state and which mode is active.
 */
function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category
}) {
  const isEditMode = Boolean(category)
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const isSubmitting = createCategory.isPending || updateCategory.isPending

  const defaultValues: CategoryFormValues = {
    name: category?.name ?? '',
    description: category?.description ?? '',
  }

  function handleSubmit(values: CategoryFormValues) {
    if (category) {
      updateCategory.mutate(
        { id: category.id, values },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      createCategory.mutate(values, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          // Avoid focus landing back on a just-removed trigger row.
          event.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Sửa danh mục' : 'Thêm danh mục'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Cập nhật thông tin danh mục "${category?.name}".`
              : 'Nhập thông tin để tạo danh mục sản phẩm mới.'}
          </DialogDescription>
        </DialogHeader>

        {/* key resets the form (and its RHF instance) whenever we switch
            which category is being edited, or between create/edit. */}
        <CategoryForm
          key={category?.id ?? 'create'}
          formId={FORM_ID}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { CategoryFormDialog }
