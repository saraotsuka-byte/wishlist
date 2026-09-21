import { describe, expect, it } from 'vitest'
import {
  adjustDelta,
  isBelowReorderPoint,
  nextStockAfterAdjust,
  nextStockAfterPurchase,
  nextStockAfterUse,
} from './stock'

describe('nextStockAfterUse', () => {
  it('在庫を使用量だけ減らす', () => {
    expect(nextStockAfterUse(5, 2)).toBe(3)
  })

  it('0を下回らない', () => {
    expect(nextStockAfterUse(1, 5)).toBe(0)
  })

  it('使用量が0以下ならエラー', () => {
    expect(() => nextStockAfterUse(5, 0)).toThrow()
    expect(() => nextStockAfterUse(5, -1)).toThrow()
  })
})

describe('nextStockAfterPurchase', () => {
  it('在庫を購入量だけ増やす', () => {
    expect(nextStockAfterPurchase(3, 4)).toBe(7)
  })

  it('購入量が0以下ならエラー', () => {
    expect(() => nextStockAfterPurchase(3, 0)).toThrow()
  })
})

describe('nextStockAfterAdjust', () => {
  it('指定した在庫数をそのまま返す', () => {
    expect(nextStockAfterAdjust(10)).toBe(10)
  })

  it('負の値はエラー', () => {
    expect(() => nextStockAfterAdjust(-1)).toThrow()
  })
})

describe('adjustDelta', () => {
  it('新旧の差分を返す', () => {
    expect(adjustDelta(5, 8)).toBe(3)
    expect(adjustDelta(8, 5)).toBe(-3)
  })
})

describe('isBelowReorderPoint', () => {
  it('発注点以下ならtrue', () => {
    expect(isBelowReorderPoint(2, 2)).toBe(true)
    expect(isBelowReorderPoint(1, 2)).toBe(true)
  })

  it('発注点より多ければfalse', () => {
    expect(isBelowReorderPoint(3, 2)).toBe(false)
  })
})
