import { describe, expect, it } from 'vitest'
import type { Purchase } from '../types'
import { computeMonthlyExpenses } from './expense'

function makePurchase(overrides: Partial<Purchase>): Purchase {
  return {
    id: 'p1',
    itemId: 'i1',
    quantity: 1,
    date: Date.now(),
    ...overrides,
  }
}

describe('computeMonthlyExpenses', () => {
  it('指定した月数分のバケットを作り、単価×数量を月ごとに合計する', () => {
    const now = new Date(2026, 8, 21).getTime() // 2026-09-21 (月は0始まり)
    const purchases: Purchase[] = [
      makePurchase({ date: new Date(2026, 8, 5).getTime(), quantity: 2, unitPrice: 100 }),
      makePurchase({ date: new Date(2026, 8, 10).getTime(), quantity: 1, unitPrice: 300 }),
      makePurchase({ date: new Date(2026, 7, 15).getTime(), quantity: 1, unitPrice: 500 }),
    ]

    const result = computeMonthlyExpenses(purchases, now, 3)

    expect(result).toHaveLength(3)
    expect(result.map((r) => r.key)).toEqual(['2026-07', '2026-08', '2026-09'])
    expect(result.find((r) => r.key === '2026-09')?.total).toBe(500) // 2*100 + 1*300
    expect(result.find((r) => r.key === '2026-08')?.total).toBe(500)
    expect(result.find((r) => r.key === '2026-07')?.total).toBe(0)
  })

  it('単価未設定の購入は0円として扱う', () => {
    const now = new Date(2026, 8, 21).getTime()
    const purchases: Purchase[] = [
      makePurchase({ date: new Date(2026, 8, 5).getTime(), quantity: 3 }),
    ]
    const result = computeMonthlyExpenses(purchases, now, 1)
    expect(result[0].total).toBe(0)
  })

  it('範囲外の月の購入は集計に含めない', () => {
    const now = new Date(2026, 8, 21).getTime()
    const purchases: Purchase[] = [
      makePurchase({ date: new Date(2025, 0, 1).getTime(), quantity: 1, unitPrice: 1000 }),
    ]
    const result = computeMonthlyExpenses(purchases, now, 2)
    expect(result.reduce((sum, r) => sum + r.total, 0)).toBe(0)
  })
})
