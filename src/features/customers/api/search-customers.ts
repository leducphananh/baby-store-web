import { supabase } from '@/lib/supabase'

export type CustomerSearchResult = {
  id: string
  name: string
  phone: string | null
}

const RESULT_LIMIT = 20

/**
 * Lean customer lookup for the Create Order screen's search-as-you-type
 * customer picker — same shape/limits as `searchProducts`. Archived
 * customers are excluded: a new order shouldn't be attached to a
 * deactivated customer record (they can still be picked from an existing
 * order's history — this only gates *new* selection).
 */
export async function searchCustomers(query: string): Promise<CustomerSearchResult[]> {
  let request = supabase
    .from('customers')
    .select('id, name, phone')
    .eq('status', 'active')
    .order('name', { ascending: true })
    .limit(RESULT_LIMIT)

  const trimmed = query.trim()
  if (trimmed) {
    // Same `.or()` delimiter-safety as the other search queries (see
    // `get-customers.ts` / `frontend-security`).
    const safe = trimmed.replace(/[,()]/g, ' ').trim()
    if (safe) {
      request = request.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%`)
    }
  }

  const { data, error } = await request
  if (error) throw error
  return data ?? []
}
