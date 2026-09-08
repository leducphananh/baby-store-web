import { describe, expect, it } from 'vitest'

import { formatCurrencyVND } from '@/utils/currency'
import { formatNumber } from '@/utils/number'

/**
 * Foundation test — a pure, deterministic formatting utility with no React
 * or network dependency. Proves plain-TypeScript tests run under Vitest.
 * (Deeper money/rounding/edge-case coverage is Phase 10.2.)
 */
describe('formatNumber', () => {
  it('groups thousands with the Vietnamese separator', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  it('rounds to the nearest integer (this app never shows fractions)', () => {
    expect(formatNumber(1234.6)).toBe('1.235')
  })

  it('formats zero as "0"', () => {
    expect(formatNumber(0)).toBe('0')
  })
})

describe('formatCurrencyVND', () => {
  it('appends the đồng sign to a grouped integer amount', () => {
    expect(formatCurrencyVND(125000)).toBe('125.000 ₫')
  })

  it('formats a zero amount', () => {
    expect(formatCurrencyVND(0)).toBe('0 ₫')
  })
})
