import { supabase } from '@/lib/supabase'

export async function completeOrder(orderId: string): Promise<void> {
  const { error } = await supabase.rpc('complete_order', {
    p_order_id: orderId,
  })
  if (error) throw error
}
