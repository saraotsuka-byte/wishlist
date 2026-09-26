import Dexie, { type EntityTable } from 'dexie'
import type {
  Category,
  Item,
  ItemStorePrice,
  Purchase,
  ShoppingListEntry,
  StockLog,
  Store,
} from '../types'

export class ConsumablesDB extends Dexie {
  categories!: EntityTable<Category, 'id'>
  stores!: EntityTable<Store, 'id'>
  items!: EntityTable<Item, 'id'>
  itemStorePrices!: EntityTable<ItemStorePrice, 'id'>
  stockLogs!: EntityTable<StockLog, 'id'>
  purchases!: EntityTable<Purchase, 'id'>
  shoppingListEntries!: EntityTable<ShoppingListEntry, 'id'>

  constructor() {
    super('consumables-app')

    this.version(1).stores({
      categories: 'id, sortOrder',
      stores: 'id, name',
      items: 'id, categoryId, name, stock, reorderPoint',
      itemStorePrices: 'id, itemId, storeId, [itemId+storeId]',
      stockLogs: 'id, itemId, type, date',
      purchases: 'id, itemId, storeId, date',
      shoppingListEntries: 'id, itemId, checked',
    })
  }
}

export const db = new ConsumablesDB()
