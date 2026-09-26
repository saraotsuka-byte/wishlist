import { describe, expect, it } from 'vitest'
import type { Item } from '../types'
import { canDeleteStore } from './store'

function makeItem(preferredStoreId?: string): Item {
  return {
    id: 'i1',
    name: 'テスト品目',
    categoryId: 'c1',
    unit: '個',
    stock: 1,
    reorderPoint: 1,
    defaultPurchaseQty: 1,
    preferredStoreId,
    createdAt: 0,
    updatedAt: 0,
  }
}

describe('canDeleteStore', () => {
  it('よく買う店として使われていなければ削除可能', () => {
    expect(canDeleteStore([makeItem('s2')], 's1')).toBe(true)
    expect(canDeleteStore([makeItem(undefined)], 's1')).toBe(true)
  })

  it('よく買う店として使われていれば削除不可', () => {
    expect(canDeleteStore([makeItem('s1')], 's1')).toBe(false)
  })
})
