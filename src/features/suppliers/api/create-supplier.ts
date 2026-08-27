import { supabase } from '@/lib/supabase'
import type { SupplierFormValues } from '@/features/suppliers/schemas/supplier-schema'

function orNull(value: string): string | null {
  return value ? value : null
}

export async function createSupplier(values: SupplierFormValues): Promise<void> {
  const { error } = await supabase.from('suppliers').insert({
    name: values.name,
    contact_person: orNull(values.contactPerson),
    phone: orNull(values.phone),
    email: orNull(values.email),
    address: orNull(values.address),
    tax_code: orNull(values.taxCode),
    notes: orNull(values.notes),
    status: values.status,
  })
  if (error) throw error
}
