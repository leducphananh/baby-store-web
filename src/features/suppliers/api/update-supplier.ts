import { supabase } from '@/lib/supabase'
import type { SupplierFormValues } from '@/features/suppliers/schemas/supplier-schema'

function orNull(value: string): string | null {
  return value ? value : null
}

export async function updateSupplier({
  id,
  values,
}: {
  id: string
  values: SupplierFormValues
}): Promise<void> {
  const { error } = await supabase
    .from('suppliers')
    .update({
      name: values.name,
      contact_person: orNull(values.contactPerson),
      phone: orNull(values.phone),
      email: orNull(values.email),
      address: orNull(values.address),
      tax_code: orNull(values.taxCode),
      notes: orNull(values.notes),
      status: values.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}
