import { db } from '../db/db'
import { planPurchaseCompletion, syncShoppingListEntries, type CheckedEntryInput } from '../domain/shoppingList'
import type { Item, ShoppingListEntry } from '../types'
import { createId } from '../utils/id'

export async function listShoppingListEntries(): Promise<ShoppingListEntry[]> {
  return db.shoppingListEntries.toArray()
}

export async function addManualEntry(
  itemId: string,
  quantity: number,
): Promise<ShoppingListEntry> {
  const entry: ShoppingListEntry = {
    id: createId(),
    itemId,
    quantity,
    isManual: true,
    checked: false,
    reason: 'manual',
    addedAt: Date.now(),
  }
  await db.shoppingListEntries.add(entry)
  return entry
}

export async function updateEntryQuantity(id: string, quantity: number): Promise<void> {
  await db.shoppingListEntries.update(id, { quantity })
}

export async function setEntryChecked(id: string, checked: boolean): Promise<void> {
  await db.shoppingListEntries.update(id, { checked })
}

export async function removeEntry(id: string): Promise<void> {
  await db.shoppingListEntries.delete(id)
}

/**
 * 発注点以下・そろそろ品目の自動同期を1トランザクションで行う。
 * Reactの状態(useLiveQueryのスナップショット)ではなく、書き込み直前にDBから
 * 現在のエントリを読み直して差分計算することで、初回読み込み中の空配列を
 * 「リストに無い」と誤判定して重複追加してしまうような競合を避ける。
 */
export async function syncAutoEntries(
  items: Item[],
  daysUntilEmptyByItemId: Map<string, number | undefined>,
  now: number,
): Promise<void> {
  await db.transaction('rw', db.shoppingListEntries, async () => {
    const currentEntries = await db.shoppingListEntries.toArray()
    const { toAdd, toRemoveIds, toUpdateReason } = syncShoppingListEntries(
      items,
      currentEntries,
      now,
      daysUntilEmptyByItemId,
    )
    if (toAdd.length > 0) {
      await db.shoppingListEntries.bulkAdd(toAdd.map((entry) => ({ ...entry, id: createId() })))
    }
    if (toRemoveIds.length > 0) {
      await db.shoppingListEntries.bulkDelete(toRemoveIds)
    }
    for (const update of toUpdateReason) {
      await db.shoppingListEntries.update(update.id, { reason: update.reason })
    }
  })
}

/**
 * チェック済みの買い物リストエントリを一括で「購入完了」にする。
 * 在庫加算・使用/購入ログ保存・購入履歴保存・リストからの除外を1トランザクションで行う。
 */
export async function completePurchase(checkedEntries: CheckedEntryInput[]): Promise<void> {
  if (checkedEntries.length === 0) return

  await db.transaction(
    'rw',
    db.items,
    db.stockLogs,
    db.purchases,
    db.shoppingListEntries,
    async () => {
      const items = await db.items.bulkGet(checkedEntries.map((e) => e.itemId))
      const validItems = items.filter((item): item is NonNullable<typeof item> => Boolean(item))
      const plan = planPurchaseCompletion(checkedEntries, validItems, Date.now())

      for (const update of plan.stockUpdates) {
        await db.items.update(update.itemId, { stock: update.newStock, updatedAt: Date.now() })
      }
      await db.stockLogs.bulkAdd(plan.stockLogs.map((log) => ({ ...log, id: createId() })))
      await db.purchases.bulkAdd(plan.purchases.map((p) => ({ ...p, id: createId() })))
      await db.shoppingListEntries.bulkDelete(plan.entryIdsToRemove)
    },
  )
}
