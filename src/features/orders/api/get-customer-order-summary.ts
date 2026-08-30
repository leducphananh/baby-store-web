import { supabase } from '@/lib/supabase'
import type { CustomerOrderSummary } from '@/features/orders/types/order'

/**
 * One aggregated row from the `customer_order_summary` view (Phase 5.2
 * migration) — a single query regardless of how many orders the customer
 * has, never fetched-and-summed client-side (see `supabase-database`,
 * `table-data-grid`). The view's `LEFT JOIN` guarantees exactly one row per
 * real customer (zero orders still aggregates to zeros, not a missing row),
 * so a missing row here only means the customer id itself doesn't exist —
 * the `?? 0`/`?? null` fallbacks below are defensive, not the expected path.
 */
export async function getCustomerOrderSummary(customerId: string): Promise<CustomerOrderSummary> {
  const { data, error } = await supabase
    .from('customer_order_summary')
    .select('total_orders, completed_orders, total_spent, last_order_date')
    .eq('customer_id', customerId)
    .maybeSingle()

  if (error) throw error

  return {
    totalOrders: data?.total_orders ?? 0,
    completedOrders: data?.completed_orders ?? 0,
    totalSpent: data?.total_spent ?? 0,
    lastOrderDate: data?.last_order_date ?? null,
  }
}
