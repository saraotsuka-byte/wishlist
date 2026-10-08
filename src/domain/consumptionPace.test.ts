import { describe, expect, it } from 'vitest'
import type { StockLog } from '../types'
import { DAY_MS } from '../utils/date'
import { computeAverageDaysPerUnit, groupOpeningEvents, lastOpenedDate } from './consumptionPace'

function useLog(id: string, date: number, quantity = 1): StockLog {
  return { id, itemId: 'i1', type: 'use', quantity, date }
}

describe('groupOpeningEvents', () => {
  it('同じ日の複数ログは1イベントにまとめ、数量を合算する', () => {
    const d0 = 10 * DAY_MS
    const events = groupOpeningEvents([
      useLog('a', d0, 1),
      useLog('b', d0 + 60 * 60 * 1000, 1), // 同日の1時間後
    ])
    expect(events).toHaveLength(1)
    expect(events[0].quantity).toBe(2)
    expect(events[0].date).toBe(d0)
  })

  it('purchase/adjustログは無視する', () => {
    const logs: StockLog[] = [
      { id: 'p', itemId: 'i1', type: 'purchase', quantity: 10, date: 1 * DAY_MS },
      { id: 'adj', itemId: 'i1', type: 'adjust', quantity: 1, date: 2 * DAY_MS },
    ]
    expect(groupOpeningEvents(logs)).toHaveLength(0)
  })
})

describe('computeAverageDaysPerUnit', () => {
  it('開封イベントが1件以下ならデータ収集中（undefined）', () => {
    expect(computeAverageDaysPerUnit([])).toBeUndefined()
    expect(computeAverageDaysPerUnit([useLog('a', 1 * DAY_MS)])).toBeUndefined()
  })

  it('一定間隔で1個ずつ開封していれば、その間隔が平均消費日数になる', () => {
    const logs = [
      useLog('a', 0),
      useLog('b', 5 * DAY_MS),
      useLog('c', 10 * DAY_MS),
    ]
    expect(computeAverageDaysPerUnit(logs)).toBeCloseTo(5)
  })

  it('複数個まとめて開封した場合は数量で正規化して1個あたりの日数にする', () => {
    // 2個まとめて開封 → 10日後に次の開封 → 1個あたり5日
    const logs = [useLog('a', 0, 2), useLog('b', 10 * DAY_MS, 1)]
    expect(computeAverageDaysPerUnit(logs)).toBeCloseTo(5)
  })

  it('直近3回の間隔のみを使い、古い不規則な間隔は無視する', () => {
    const logs = [
      useLog('a', 0), // 外れ値になる極端に長い最初の間隔
      useLog('b', 100 * DAY_MS),
      useLog('c', 105 * DAY_MS),
      useLog('d', 110 * DAY_MS),
      useLog('e', 115 * DAY_MS),
    ]
    // 直近3間隔は 5,5,5 日 → 平均5日（最初の100日間隔は無視される）
    expect(computeAverageDaysPerUnit(logs)).toBeCloseTo(5)
  })
})

describe('lastOpenedDate', () => {
  it('記録が無ければundefined', () => {
    expect(lastOpenedDate([])).toBeUndefined()
  })

  it('最後に開封した日時を返す', () => {
    const logs = [useLog('a', 1 * DAY_MS), useLog('b', 9 * DAY_MS)]
    expect(lastOpenedDate(logs)).toBe(9 * DAY_MS)
  })
})
