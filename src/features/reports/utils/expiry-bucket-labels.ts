import type { ExpiryBucketKey } from '@/features/reports/types/expiry'

/**
 * One place the 7 fixed expiry buckets get their Vietnamese label — reused
 * by the chart and its accessible table counterpart (requirement §9/§41).
 * Bucket boundaries are explicit and transparent, not implied risk levels.
 */
export const EXPIRY_BUCKET_LABEL: Record<ExpiryBucketKey, string> = {
  expired: 'Đã hết hạn',
  due_0_7: '0–7 ngày',
  due_8_30: '8–30 ngày',
  due_31_60: '31–60 ngày',
  due_61_90: '61–90 ngày',
  due_over_90: 'Trên 90 ngày',
  missing_expiry: 'Chưa có HSD',
}
