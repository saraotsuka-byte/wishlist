import { db } from '../db/db'
import { planPurchaseCompletion, type CheckedEntryInput } from '../domain/shoppingList'
import type { ShoppingListEntry } from '../types'
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

export async function bulkAddEntries(entries: Omit<ShoppingListEntry, 'id'>[]): Promise<void> {
  if (entries.length === 0) return
  await db.shoppingListEntries.bulkAdd(entries.map((entry) => ({ ...entry, id: createId() })))
}

export async function bulkRemoveEntries(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  await db.shoppingListEntries.bulkDelete(ids)
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
