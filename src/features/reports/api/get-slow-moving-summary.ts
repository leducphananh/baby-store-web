import { supabase } from '@/lib/supabase'
import type { SalesLookbackDays, SlowMovingSummary } from '@/features/reports/types/expiry'

/** Factual "never sold" / "no sale in lookback" KPIs — see `get_slow_moving_summary()`'s migration comment. No slow-moving classification. */
export async function getSlowMovingSummary(lookbackDays: SalesLookbackDays): Promise<SlowMovingSummary> {
  const { data, error } = await supabase.rpc('get_slow_moving_summary', { p_lookback_days: lookbackDays })
  if (error) throw error

  const row = data?.[0]
  return {
    neverSoldCount: row?.never_sold_count ?? 0,
    neverSoldValue: row?.never_sold_value ?? 0,
    noSaleInLookbackCount: row?.no_sale_in_lookback_count ?? 0,
    noSaleInLookbackValue: row?.no_sale_in_lookback_value ?? 0,
  }
}
