import type { ProfitDailyPoint } from '@/features/reports/types/profit'

/**
 * The single highest-gross-profit day in an already-fetched daily series
 * (no extra query — requirement §59: "Do not create another query solely
 * for this metric"). `null` when every day is <= 0 (nothing worth
 * highlighting) or the series is empty. Unlike `findBestRevenueDay`, 0
 * itself doesn't count as "best" either — a flat, order-free period has no
 * profit day worth calling out.
 */
export function findBestProfitDay(data: ProfitDailyPoint[]): ProfitDailyPoint | null {
  let best: ProfitDailyPoint | null = null
  for (const point of data) {
    if (point.grossProfit > 0 && (best === null || point.grossProfit > best.grossProfit)) {
      best = point
    }
  }
  return best
}
