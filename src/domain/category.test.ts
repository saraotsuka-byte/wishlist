import { describe, expect, it } from 'vitest'
import type { Item } from '../types'
import { canDeleteCategory } from './category'

function makeItem(categoryId: string): Item {
  return {
    id: 'i1',
    name: 'テスト品目',
    categoryId,
    unit: '個',
    stock: 1,
    reorderPoint: 1,
    defaultPurchaseQty: 1,
    createdAt: 0,
    updatedAt: 0,
  }
}

describe('canDeleteCategory', () => {
  it('該当カテゴリを使う品目がなければ削除可能', () => {
    expect(canDeleteCategory([makeItem('c2')], 'c1')).toBe(true)
  })

  it('該当カテゴリを使う品目があれば削除不可', () => {
    expect(canDeleteCategory([makeItem('c1')], 'c1')).toBe(false)
  })
})
