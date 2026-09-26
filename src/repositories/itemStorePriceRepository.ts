import { db } from '../db/db'
import type { ItemStorePrice } from '../types'
import { createId } from '../utils/id'

export async function listPricesByItem(itemId: string): Promise<ItemStorePrice[]> {
  return db.itemStorePrices.where('itemId').equals(itemId).toArray()
}

export async function upsertPrice(
  itemId: string,
  storeId: string,
  lastPrice: number,
): Promise<ItemStorePrice> {
  const existing = await db.itemStorePrices
    .where('[itemId+storeId]')
    .equals([itemId, storeId])
    .first()

  if (existing) {
    const updated: ItemStorePrice = { ...existing, lastPrice, updatedAt: Date.now() }
    await db.itemStorePrices.put(updated)
    return updated
  }

  const created: ItemStorePrice = {
    id: createId(),
    itemId,
    storeId,
    lastPrice,
    updatedAt: Date.now(),
  }
  await db.itemStorePrices.add(created)
  return created
}

export async function deletePrice(id: string): Promise<void> {
  await db.itemStorePrices.delete(id)
}
