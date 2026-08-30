import { supabase } from '@/lib/supabase'
import type { CustomerFormValues } from '@/features/customers/schemas/customer-schema'
import type { Customer } from '@/features/customers/types/customer'

function orNull(value: string): string | null {
  return value ? value : null
}

/**
 * Returns the created row (not just void) so a caller that needs the new
 * id right away — the Create Order screen's "quick add customer" flow —
 * can select it immediately, without a second round trip.
 */
export async function createCustomer(values: CustomerFormValues): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: values.name,
      phone: orNull(values.phone),
      email: orNull(values.email),
      address: orNull(values.address),
      notes: orNull(values.notes),
      status: values.status,
    })
    .select()
    .single()
  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    notes: data.notes,
    status: data.status === 'archived' ? 'archived' : 'active',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
