import { describe, expect, it } from 'vitest'
import type { StockLog } from '../types'
import { DAY_MS } from '../utils/date'
import { computeDailyUsageRate, isSoon, predictDaysUntilEmpty } from './prediction'

function useLog(date: number, quantity = 1): StockLog {
  return { id: `l-${date}`, itemId: 'i1', type: 'use', quantity, date }
}

describe('computeDailyUsageRate', () => {
  it('使用記録が1件以下ならデータ不足', () => {
    const now = 100 * DAY_MS
    expect(computeDailyUsageRate([], now)).toBeUndefined()
    expect(computeDailyUsageRate([useLog(now - 5 * DAY_MS)], now)).toBeUndefined()
  })

  it('記録期間が1日未満ならデータ不足', () => {
    const now = 100 * DAY_MS
    const logs = [useLog(now - 1000), useLog(now - 2000)]
    expect(computeDailyUsageRate(logs, now)).toBeUndefined()
  })

  it('十分なデータがあれば1日あたりの消費量を計算する', () => {
    const now = 100 * DAY_MS
    const logs = [useLog(now - 10 * DAY_MS, 1), useLog(now - 5 * DAY_MS, 1)]
    // 合計2個 / 10日間 = 0.2個/日
    expect(computeDailyUsageRate(logs, now)).toBeCloseTo(0.2)
  })

  it('90日より古い記録は集計対象外', () => {
    const now = 200 * DAY_MS
    const logs = [useLog(now - 120 * DAY_MS, 5), useLog(now - 100 * DAY_MS, 5)]
    expect(computeDailyUsageRate(logs, now)).toBeUndefined()
  })

  it('purchase/adjustログは集計対象外', () => {
    const now = 100 * DAY_MS
    const logs: StockLog[] = [
      { id: 'a', itemId: 'i1', type: 'purchase', quantity: 10, date: now - 10 * DAY_MS },
      { id: 'b', itemId: 'i1', type: 'adjust', quantity: 5, date: now - 5 * DAY_MS },
    ]
    expect(computeDailyUsageRate(logs, now)).toBeUndefined()
  })
})

describe('predictDaysUntilEmpty', () => {
  it('消費ペースが不明ならデータ不足', () => {
    expect(predictDaysUntilEmpty(10, undefined)).toBeUndefined()
  })

  it('消費ペースが0以下ならデータ不足', () => {
    expect(predictDaysUntilEmpty(10, 0)).toBeUndefined()
  })

  it('在庫0ならあと0日', () => {
    expect(predictDaysUntilEmpty(0, 0.5)).toBe(0)
  })

  it('在庫と消費ペースから日数を計算する', () => {
    expect(predictDaysUntilEmpty(10, 2)).toBe(5)
  })
})

describe('isSoon', () => {
  it('7日以内ならtrue', () => {
    expect(isSoon(7)).toBe(true)
    expect(isSoon(3)).toBe(true)
  })

  it('7日を超える、またはデータ不足ならfalse', () => {
    expect(isSoon(8)).toBe(false)
    expect(isSoon(undefined)).toBe(false)
  })
})
