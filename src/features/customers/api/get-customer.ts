import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import type { Customer, CustomerStatus } from '@/features/customers/types/customer'

type CustomerRow = Tables<'customers'>

function isCustomerStatus(value: string): value is CustomerStatus {
  return value === 'active' || value === 'archived'
}

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    status: isCustomerStatus(row.status) ? row.status : 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * A single customer for the detail page. Returns `null` when the id
 * doesn't exist (or is hidden by RLS) so the route can show a "not found"
 * state instead of throwing (same pattern as `get-import-receipt.ts`,
 * `get-product.ts`).
 */
export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle<CustomerRow>()

  if (error) throw error
  if (!data) return null

  return toCustomer(data)
}
