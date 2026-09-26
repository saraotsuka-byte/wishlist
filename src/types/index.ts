export type StockLogType = 'use' | 'purchase' | 'adjust'

export type ShoppingListReason = 'reorder' | 'soon' | 'manual'

export interface Category {
  id: string
  name: string
  sortOrder: number
}

export interface Store {
  id: string
  name: string
  url?: string
}

export interface Item {
  id: string
  name: string
  categoryId: string
  unit: string
  stock: number
  reorderPoint: number
  defaultPurchaseQty: number
  note?: string
  preferredStoreId?: string
  createdAt: number
  updatedAt: number
}

export interface ItemStorePrice {
  id: string
  itemId: string
  storeId: string
  lastPrice: number
  updatedAt: number
}

export interface StockLog {
  id: string
  itemId: string
  type: StockLogType
  quantity: number
  date: number
}

export interface Purchase {
  id: string
  itemId: string
  storeId?: string
  quantity: number
  unitPrice?: number
  date: number
}

export interface ShoppingListEntry {
  id: string
  itemId: string
  quantity: number
  isManual: boolean
  checked: boolean
  reason: ShoppingListReason
  addedAt: number
}
