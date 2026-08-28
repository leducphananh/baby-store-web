import { supabase } from '@/lib/supabase'
import type { Supplier, SupplierStatus } from '@/features/suppliers/types/supplier'

function toStatus(value: string): SupplierStatus {
  return value === 'archived' ? 'archived' : 'active'
}

/**
 * The whole suppliers table as a flat, name-sorted list — for `<Select>`
 * options and list filters in other features (import receipts today).
 * Suppliers are a small, bounded set, so one cached fetch beats paginating
 * a dropdown. List *views* still use the paginated `getSuppliers`.
 */
export async function getAllSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select(
      'id, name, phone, email, address, tax_code, contact_person, notes, status, created_at, updated_at',
    )
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    taxCode: row.tax_code,
    contactPerson: row.contact_person,
    notes: row.notes,
    status: toStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}
