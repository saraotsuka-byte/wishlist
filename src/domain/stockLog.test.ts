import { describe, expect, it } from 'vitest'
import type { StockLog } from '../types'
import { stockAfterStockLogDeletion, stockAfterStockLogQuantityEdit } from './stockLog'

function log(type: StockLog['type'], quantity: number): StockLog {
  return { id: 'l1', itemId: 'i1', type, quantity, date: 0 }
}

describe('stockAfterStockLogDeletion', () => {
  it('useログを削除すると在庫が戻る（復元）', () => {
    expect(stockAfterStockLogDeletion(3, log('use', 1))).toBe(4)
  })

  it('adjustログを削除すると在庫が減る（取り消し）', () => {
    expect(stockAfterStockLogDeletion(5, log('adjust', 2))).toBe(3)
  })

  it('0未満にはならない', () => {
    expect(stockAfterStockLogDeletion(1, log('adjust', 5))).toBe(0)
  })
})

describe('stockAfterStockLogQuantityEdit', () => {
  it('useログの数量を増やすと在庫がさらに減る', () => {
    // 元は1個使用として在庫4（5-1）。2個使用に修正すると在庫3になる。
    expect(stockAfterStockLogQuantityEdit(4, log('use', 1), 2)).toBe(3)
  })

  it('useログの数量を減らすと在庫が戻る', () => {
    expect(stockAfterStockLogQuantityEdit(4, log('use', 2), 1)).toBe(5)
  })

  it('adjustログの数量を増やすと在庫がさらに増える', () => {
    expect(stockAfterStockLogQuantityEdit(5, log('adjust', 1), 3)).toBe(7)
  })

  it('0以下の数量は不正', () => {
    expect(() => stockAfterStockLogQuantityEdit(5, log('use', 1), 0)).toThrow()
  })

  it('0未満にはならない', () => {
    expect(stockAfterStockLogQuantityEdit(1, log('use', 1), 5)).toBe(0)
  })
})
