import type { Item, ShoppingListEntry } from '../types'
import { isBelowReorderPoint, nextStockAfterPurchase } from './stock'

export interface ShoppingListSyncResult {
  toAdd: Omit<ShoppingListEntry, 'id'>[]
  toRemoveIds: string[]
}

/**
 * 発注点以下の品目を自動で買い物リストに載せ、発注点を上回った品目の
 * 自動追加エントリ（手動追加以外）をリストから外すための差分を計算する。
 */
export function syncShoppingListEntries(
  items: Item[],
  entries: ShoppingListEntry[],
  now: number,
): ShoppingListSyncResult {
  const entryByItemId = new Map(entries.map((entry) => [entry.itemId, entry]))

  const toAdd: Omit<ShoppingListEntry, 'id'>[] = []
  for (const item of items) {
    if (!isBelowReorderPoint(item.stock, item.reorderPoint)) continue
    if (entryByItemId.has(item.id)) continue
    toAdd.push({
      itemId: item.id,
      quantity: item.defaultPurchaseQty,
      isManual: false,
      checked: false,
      reason: 'reorder',
      addedAt: now,
    })
  }

  const itemById = new Map(items.map((item) => [item.id, item]))
  const toRemoveIds: string[] = []
  for (const entry of entries) {
    if (entry.isManual) continue
    if (entry.reason !== 'reorder') continue
    const item = itemById.get(entry.itemId)
    if (!item || !isBelowReorderPoint(item.stock, item.reorderPoint)) {
      toRemoveIds.push(entry.id)
    }
  }

  return { toAdd, toRemoveIds }
}

export interface CheckedEntryInput {
  entryId: string
  itemId: string
  quantity: number
  storeId?: string
  unitPrice?: number
}

export interface PurchaseCompletionPlan {
  stockUpdates: { itemId: string; newStock: number }[]
  stockLogs: { itemId: string; type: 'purchase'; quantity: number; date: number }[]
  purchases: { itemId: string; storeId?: string; quantity: number; unitPrice?: number; date: number }[]
  entryIdsToRemove: string[]
}

/**
 * 買い物リストでチェックされた品目の「購入完了」処理内容を計算する純粋関数。
 * 在庫加算・購入履歴保存・リストからの除外に必要な情報をまとめて返す。
 */
export function planPurchaseCompletion(
  checkedEntries: CheckedEntryInput[],
  items: Item[],
  date: number,
): PurchaseCompletionPlan {
  const itemById = new Map(items.map((item) => [item.id, item]))

  const stockUpdates: PurchaseCompletionPlan['stockUpdates'] = []
  const stockLogs: PurchaseCompletionPlan['stockLogs'] = []
  const purchases: PurchaseCompletionPlan['purchases'] = []
  const entryIdsToRemove: string[] = []

  for (const entry of checkedEntries) {
    const item = itemById.get(entry.itemId)
    if (!item || entry.quantity <= 0) continue

    const newStock = nextStockAfterPurchase(item.stock, entry.quantity)
    stockUpdates.push({ itemId: entry.itemId, newStock })
    stockLogs.push({ itemId: entry.itemId, type: 'purchase', quantity: entry.quantity, date })
    purchases.push({
      itemId: entry.itemId,
      storeId: entry.storeId,
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
      date,
    })
    entryIdsToRemove.push(entry.entryId)
  }

  return { stockUpdates, stockLogs, purchases, entryIdsToRemove }
}
