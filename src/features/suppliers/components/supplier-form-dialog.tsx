import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SupplierForm } from '@/features/suppliers/components/supplier-form'
import { useCreateSupplier } from '@/features/suppliers/hooks/use-create-supplier'
import { useUpdateSupplier } from '@/features/suppliers/hooks/use-update-supplier'
import type { SupplierFormValues } from '@/features/suppliers/schemas/supplier-schema'
import type { Supplier } from '@/features/suppliers/types/supplier'

const FORM_ID = 'supplier-form'

/** Same create/edit dialog pattern as `CategoryFormDialog`. */
function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: Supplier
}) {
  const isEditMode = Boolean(supplier)
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()

  const isSubmitting = createSupplier.isPending || updateSupplier.isPending

  const defaultValues: SupplierFormValues = {
    name: supplier?.name ?? '',
    contactPerson: supplier?.contactPerson ?? '',
    phone: supplier?.phone ?? '',
    email: supplier?.email ?? '',
    address: supplier?.address ?? '',
    taxCode: supplier?.taxCode ?? '',
    notes: supplier?.notes ?? '',
    status: supplier?.status ?? 'active',
  }

  function handleSubmit(values: SupplierFormValues) {
    if (supplier) {
      updateSupplier.mutate({ id: supplier.id, values }, { onSuccess: () => onOpenChange(false) })
    } else {
      createSupplier.mutate(values, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Cập nhật thông tin nhà cung cấp "${supplier?.name}".`
              : 'Nhập thông tin để thêm nhà cung cấp mới.'}
          </DialogDescription>
        </DialogHeader>

        <SupplierForm
          key={supplier?.id ?? 'create'}
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
            {isSubmitting ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Thêm nhà cung cấp'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { SupplierFormDialog }
