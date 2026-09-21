import { describe, expect, it } from 'vitest'
import type { Item, ShoppingListEntry } from '../types'
import { planPurchaseCompletion, syncShoppingListEntries } from './shoppingList'

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    name: '品目',
    categoryId: 'cat-1',
    unit: '個',
    stock: 5,
    reorderPoint: 2,
    defaultPurchaseQty: 3,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

describe('syncShoppingListEntries', () => {
  it('発注点以下でリストに無い品目を追加する', () => {
    const item = makeItem({ id: 'a', stock: 1, reorderPoint: 2, defaultPurchaseQty: 4 })
    const result = syncShoppingListEntries([item], [], 1000)
    expect(result.toAdd).toHaveLength(1)
    expect(result.toAdd[0]).toMatchObject({
      itemId: 'a',
      quantity: 4,
      isManual: false,
      checked: false,
      reason: 'reorder',
      addedAt: 1000,
    })
    expect(result.toRemoveIds).toHaveLength(0)
  })

  it('既にリストにある品目は重複追加しない', () => {
    const item = makeItem({ id: 'a', stock: 1, reorderPoint: 2 })
    const entry: ShoppingListEntry = {
      id: 'e1',
      itemId: 'a',
      quantity: 4,
      isManual: false,
      checked: false,
      reason: 'reorder',
      addedAt: 0,
    }
    const result = syncShoppingListEntries([item], [entry], 1000)
    expect(result.toAdd).toHaveLength(0)
  })

  it('発注点を上回った自動追加エントリは削除対象になる', () => {
    const item = makeItem({ id: 'a', stock: 10, reorderPoint: 2 })
    const entry: ShoppingListEntry = {
      id: 'e1',
      itemId: 'a',
      quantity: 4,
      isManual: false,
      checked: false,
      reason: 'reorder',
      addedAt: 0,
    }
    const result = syncShoppingListEntries([item], [entry], 1000)
    expect(result.toRemoveIds).toEqual(['e1'])
  })

  it('手動追加エントリは在庫状況に関わらず削除しない', () => {
    const item = makeItem({ id: 'a', stock: 10, reorderPoint: 2 })
    const entry: ShoppingListEntry = {
      id: 'e1',
      itemId: 'a',
      quantity: 1,
      isManual: true,
      checked: false,
      reason: 'manual',
      addedAt: 0,
    }
    const result = syncShoppingListEntries([item], [entry], 1000)
    expect(result.toRemoveIds).toHaveLength(0)
  })
})

describe('planPurchaseCompletion', () => {
  it('チェックした品目の在庫加算・履歴・リスト除外を計画する', () => {
    const item = makeItem({ id: 'a', stock: 2 })
    const plan = planPurchaseCompletion(
      [{ entryId: 'e1', itemId: 'a', quantity: 3, storeId: 's1', unitPrice: 200 }],
      [item],
      5000,
    )

    expect(plan.stockUpdates).toEqual([{ itemId: 'a', newStock: 5 }])
    expect(plan.stockLogs).toEqual([{ itemId: 'a', type: 'purchase', quantity: 3, date: 5000 }])
    expect(plan.purchases).toEqual([
      { itemId: 'a', storeId: 's1', quantity: 3, unitPrice: 200, date: 5000 },
    ])
    expect(plan.entryIdsToRemove).toEqual(['e1'])
  })

  it('数量が0以下のエントリは無視する', () => {
    const item = makeItem({ id: 'a', stock: 2 })
    const plan = planPurchaseCompletion(
      [{ entryId: 'e1', itemId: 'a', quantity: 0 }],
      [item],
      5000,
    )
    expect(plan.stockUpdates).toHaveLength(0)
    expect(plan.entryIdsToRemove).toHaveLength(0)
  })

  it('対応する品目が見つからない場合は無視する', () => {
    const plan = planPurchaseCompletion(
      [{ entryId: 'e1', itemId: 'missing', quantity: 1 }],
      [],
      5000,
    )
    expect(plan.stockUpdates).toHaveLength(0)
  })
})
