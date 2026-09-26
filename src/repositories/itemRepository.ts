import { db } from '../db/db'
import type { Item } from '../types'
import { createId } from '../utils/id'

export type NewItemInput = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>
export type ItemUpdateInput = Partial<NewItemInput>

export async function listItems(): Promise<Item[]> {
  return db.items.orderBy('name').toArray()
}

export async function getItem(id: string): Promise<Item | undefined> {
  return db.items.get(id)
}

export async function createItem(input: NewItemInput): Promise<Item> {
  const now = Date.now()
  const item: Item = { ...input, id: createId(), createdAt: now, updatedAt: now }
  await db.items.add(item)
  return item
}

export async function updateItem(id: string, changes: ItemUpdateInput): Promise<void> {
  await db.items.update(id, { ...changes, updatedAt: Date.now() })
}

export async function deleteItem(id: string): Promise<void> {
  await db.transaction(
    'rw',
    db.items,
    db.stockLogs,
    db.purchases,
    db.itemStorePrices,
    db.shoppingListEntries,
    async () => {
      await db.items.delete(id)
      await db.stockLogs.where('itemId').equals(id).delete()
      await db.purchases.where('itemId').equals(id).delete()
      await db.itemStorePrices.where('itemId').equals(id).delete()
      await db.shoppingListEntries.where('itemId').equals(id).delete()
    },
  )
}

export async function setItemStock(id: string, stock: number): Promise<void> {
  await db.items.update(id, { stock, updatedAt: Date.now() })
}
