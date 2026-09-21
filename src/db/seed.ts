import { db } from './db'
import { buildDefaultCategories, DEFAULT_CATEGORY_NAMES } from './defaultCategories'
import type { Item, ItemStorePrice, Store } from '../types'
import { createId } from '../utils/id'

const DAY_MS = 24 * 60 * 60 * 1000

export async function hasAnyCategory(): Promise<boolean> {
  const count = await db.categories.count()
  return count > 0
}

export async function initEmptyDatabase(): Promise<void> {
  const categories = buildDefaultCategories(createId)
  await db.categories.bulkAdd(categories)
}

export async function initSampleDatabase(): Promise<void> {
  const categories = buildDefaultCategories(createId)
  await db.categories.bulkAdd(categories)

  const categoryByName = (name: (typeof DEFAULT_CATEGORY_NAMES)[number]) =>
    categories.find((c) => c.name === name)!

  const store: Store = { id: createId(), name: '近所のスーパー', url: undefined }
  const drugstore: Store = { id: createId(), name: 'ドラッグストア', url: undefined }
  await db.stores.bulkAdd([store, drugstore])

  const now = Date.now()

  const items: Item[] = [
    {
      id: createId(),
      name: '食器用洗剤',
      categoryId: categoryByName('キッチン').id,
      unit: '本',
      stock: 1,
      reorderPoint: 1,
      defaultPurchaseQty: 2,
      note: '',
      preferredStoreId: store.id,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId(),
      name: 'シャンプー',
      categoryId: categoryByName('洗面・バス').id,
      unit: '本',
      stock: 2,
      reorderPoint: 1,
      defaultPurchaseQty: 1,
      note: '',
      preferredStoreId: drugstore.id,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId(),
      name: 'トイレットペーパー',
      categoryId: categoryByName('トイレ').id,
      unit: 'ロール',
      stock: 4,
      reorderPoint: 6,
      defaultPurchaseQty: 12,
      note: '12ロール入りで購入',
      preferredStoreId: store.id,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId(),
      name: 'ティッシュペーパー',
      categoryId: categoryByName('その他').id,
      unit: '箱',
      stock: 5,
      reorderPoint: 2,
      defaultPurchaseQty: 5,
      note: '',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId(),
      name: '洗濯用洗剤',
      categoryId: categoryByName('洗濯').id,
      unit: '個',
      stock: 1,
      reorderPoint: 1,
      defaultPurchaseQty: 1,
      note: '',
      preferredStoreId: store.id,
      createdAt: now,
      updatedAt: now,
    },
  ]
  await db.items.bulkAdd(items)

  const prices: ItemStorePrice[] = [
    { id: createId(), itemId: items[0].id, storeId: store.id, lastPrice: 198, updatedAt: now },
    { id: createId(), itemId: items[1].id, storeId: drugstore.id, lastPrice: 780, updatedAt: now },
    { id: createId(), itemId: items[2].id, storeId: store.id, lastPrice: 498, updatedAt: now },
    { id: createId(), itemId: items[4].id, storeId: store.id, lastPrice: 398, updatedAt: now },
  ]
  await db.itemStorePrices.bulkAdd(prices)

  const stockLogs = [
    { itemId: items[0].id, daysAgo: 20, qty: 1 },
    { itemId: items[0].id, daysAgo: 10, qty: 1 },
    { itemId: items[2].id, daysAgo: 15, qty: 2 },
    { itemId: items[2].id, daysAgo: 5, qty: 2 },
    { itemId: items[3].id, daysAgo: 12, qty: 1 },
  ].map(({ itemId, daysAgo, qty }) => ({
    id: createId(),
    itemId,
    type: 'use' as const,
    quantity: qty,
    date: now - daysAgo * DAY_MS,
  }))
  await db.stockLogs.bulkAdd(stockLogs)
}
