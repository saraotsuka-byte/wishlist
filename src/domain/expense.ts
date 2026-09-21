import type { Purchase } from '../types'
import { monthKey, monthLabel } from '../utils/date'

export interface MonthlyExpense {
  key: string
  label: string
  total: number
}

/**
 * 直近 `monthsBack` ヶ月（当月含む）ごとの消耗品支出合計を計算する。
 */
export function computeMonthlyExpenses(
  purchases: Purchase[],
  now: number,
  monthsBack = 6,
): MonthlyExpense[] {
  const cursor = new Date(now)
  cursor.setDate(1)
  cursor.setHours(0, 0, 0, 0)

  const buckets: MonthlyExpense[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(cursor)
    d.setMonth(d.getMonth() - i)
    const key = monthKey(d.getTime())
    buckets.push({ key, label: monthLabel(key), total: 0 })
  }

  const bucketByKey = new Map(buckets.map((b) => [b.key, b]))
  for (const purchase of purchases) {
    const bucket = bucketByKey.get(monthKey(purchase.date))
    if (bucket) bucket.total += (purchase.unitPrice ?? 0) * purchase.quantity
  }

  return buckets
}
