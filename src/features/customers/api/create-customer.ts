import { supabase } from '@/lib/supabase'
import type { CustomerFormValues } from '@/features/customers/schemas/customer-schema'

function orNull(value: string): string | null {
  return value ? value : null
}

export async function createCustomer(values: CustomerFormValues): Promise<void> {
  const { error } = await supabase.from('customers').insert({
    name: values.name,
    phone: orNull(values.phone),
    email: orNull(values.email),
    address: orNull(values.address),
    notes: orNull(values.notes),
    status: values.status,
  })
  if (error) throw error
}
