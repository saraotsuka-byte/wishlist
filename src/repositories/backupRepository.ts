import { db } from '../db/db'
import { serializeBackup, type BackupData, type BackupPayload } from '../domain/backup'

export async function exportAllData(): Promise<BackupData> {
  const [
    categories,
    stores,
    items,
    itemStorePrices,
    stockLogs,
    purchases,
    shoppingListEntries,
  ] = await Promise.all([
    db.categories.toArray(),
    db.stores.toArray(),
    db.items.toArray(),
    db.itemStorePrices.toArray(),
    db.stockLogs.toArray(),
    db.purchases.toArray(),
    db.shoppingListEntries.toArray(),
  ])

  const payload: BackupPayload = {
    categories,
    stores,
    items,
    itemStorePrices,
    stockLogs,
    purchases,
    shoppingListEntries,
  }
  return serializeBackup(payload, Date.now())
}

/**
 * バックアップデータで現在のDBを全置き換えする。取り消せないため呼び出し側で確認を取ること。
 */
export async function importAllData(data: BackupData): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.categories,
      db.stores,
      db.items,
      db.itemStorePrices,
      db.stockLogs,
      db.purchases,
      db.shoppingListEntries,
    ],
    async () => {
      await Promise.all([
        db.categories.clear(),
        db.stores.clear(),
        db.items.clear(),
        db.itemStorePrices.clear(),
        db.stockLogs.clear(),
        db.purchases.clear(),
        db.shoppingListEntries.clear(),
      ])
      await Promise.all([
        db.categories.bulkAdd(data.categories),
        db.stores.bulkAdd(data.stores),
        db.items.bulkAdd(data.items),
        db.itemStorePrices.bulkAdd(data.itemStorePrices),
        db.stockLogs.bulkAdd(data.stockLogs),
        db.purchases.bulkAdd(data.purchases),
        db.shoppingListEntries.bulkAdd(data.shoppingListEntries),
      ])
    },
  )
}
