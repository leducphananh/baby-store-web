import type { RevenueDailyPoint } from '@/features/reports/types/revenue'

/**
 * The single highest-revenue day in an already-fetched daily series (no
 * extra query — requirement §21: "Do not create another expensive query
 * solely for this metric"). `null` when every day is 0 (nothing to
 * highlight) or the series is empty.
 */
export function findBestRevenueDay(data: RevenueDailyPoint[]): RevenueDailyPoint | null {
  let best: RevenueDailyPoint | null = null
  for (const point of data) {
    if (point.revenue > 0 && (best === null || point.revenue > best.revenue)) {
      best = point
    }
  }
  return best
}
