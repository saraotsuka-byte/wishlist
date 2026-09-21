import { describe, expect, it } from 'vitest'
import type { Item } from '../types'
import { categorizeItem, groupItemsByCategory } from './dashboard'

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'i1',
    name: '品目',
    categoryId: 'c1',
    unit: '個',
    stock: 5,
    reorderPoint: 2,
    defaultPurchaseQty: 1,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

describe('categorizeItem', () => {
  it('発注点以下なら urgent', () => {
    const item = makeItem({ stock: 1, reorderPoint: 2 })
    expect(categorizeItem(item, undefined)).toBe('urgent')
  })

  it('発注点は上回るが7日以内に切れる予測なら soon', () => {
    const item = makeItem({ stock: 5, reorderPoint: 2 })
    expect(categorizeItem(item, 5)).toBe('soon')
  })

  it('どちらでもなければ sufficient', () => {
    const item = makeItem({ stock: 5, reorderPoint: 2 })
    expect(categorizeItem(item, 30)).toBe('sufficient')
    expect(categorizeItem(item, undefined)).toBe('sufficient')
  })
})

describe('groupItemsByCategory', () => {
  it('品目を3区分に振り分ける', () => {
    const urgent = makeItem({ id: 'a', stock: 1, reorderPoint: 2 })
    const soon = makeItem({ id: 'b', stock: 5, reorderPoint: 2 })
    const sufficient = makeItem({ id: 'c', stock: 5, reorderPoint: 2 })
    const map = new Map([
      ['b', 5],
      ['c', 30],
    ])
    const groups = groupItemsByCategory([urgent, soon, sufficient], map)
    expect(groups.urgent.map((i) => i.id)).toEqual(['a'])
    expect(groups.soon.map((i) => i.id)).toEqual(['b'])
    expect(groups.sufficient.map((i) => i.id)).toEqual(['c'])
  })
})
