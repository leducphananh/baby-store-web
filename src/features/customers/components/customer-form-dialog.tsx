import type { UseFormReturn } from 'react-hook-form'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CustomerForm } from '@/features/customers/components/customer-form'
import { useCreateCustomer } from '@/features/customers/hooks/use-create-customer'
import { useUpdateCustomer } from '@/features/customers/hooks/use-update-customer'
import { getCustomerUniqueField } from '@/features/customers/utils/get-customer-error-message'
import type { CustomerFormValues } from '@/features/customers/schemas/customer-schema'
import type { Customer } from '@/features/customers/types/customer'

const FORM_ID = 'customer-form'

/** Same create/edit dialog pattern as `SupplierFormDialog`. */
function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
  /**
   * Called with the newly created customer right after a successful create
   * (never on edit) — lets a caller like `CustomerComboBox`'s "quick add"
   * flow select the new customer immediately, without a second lookup.
   */
  onCreated?: (customer: Customer) => void
}) {
  const isEditMode = Boolean(customer)
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()

  const isSubmitting = createCustomer.isPending || updateCustomer.isPending

  const defaultValues: CustomerFormValues = {
    name: customer?.name ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    address: customer?.address ?? '',
    notes: customer?.notes ?? '',
    status: customer?.status ?? 'active',
  }

  /**
   * A duplicate phone number (`customers.phone` is UNIQUE) is attributable
   * to one field, so it's surfaced inline there instead of only as a toast
   * (see `react-hook-form-zod` rule 7) — the mutation hooks already show
   * the toast either way.
   */
  function handleSubmit(values: CustomerFormValues, form: UseFormReturn<CustomerFormValues>) {
    function onError(error: unknown) {
      if (getCustomerUniqueField(error) === 'phone') {
        form.setError('phone', { type: 'server', message: 'Số điện thoại này đã được dùng' })
      }
    }

    if (customer) {
      updateCustomer.mutate(
        { id: customer.id, values },
        { onSuccess: () => onOpenChange(false), onError },
      )
      return
    }

    createCustomer.mutate(values, {
      onSuccess: (created) => {
        onOpenChange(false)
        onCreated?.(created)
      },
      onError,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Sửa khách hàng' : 'Thêm khách hàng'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Cập nhật thông tin khách hàng "${customer?.name}".`
              : 'Nhập thông tin để thêm khách hàng mới.'}
          </DialogDescription>
        </DialogHeader>

        <CustomerForm
          key={customer?.id ?? 'create'}
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
            {isSubmitting ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Thêm khách hàng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { CustomerFormDialog }
