import { db } from '../db/db'
import { stockAfterStockLogDeletion, stockAfterStockLogQuantityEdit } from '../domain/stockLog'
import type { StockLog, StockLogType } from '../types'
import { createId } from '../utils/id'

export async function addStockLog(
  itemId: string,
  type: StockLogType,
  quantity: number,
  date: number = Date.now(),
): Promise<StockLog> {
  const log: StockLog = { id: createId(), itemId, type, quantity, date }
  await db.stockLogs.add(log)
  return log
}

export async function listStockLogsByItem(itemId: string): Promise<StockLog[]> {
  const logs = await db.stockLogs.where('itemId').equals(itemId).sortBy('date')
  return logs.reverse()
}

export async function listAllStockLogs(): Promise<StockLog[]> {
  return db.stockLogs.orderBy('date').toArray()
}

/**
 * 誤操作で記録した履歴を削除する。削除したログが在庫に与えていた影響（使用による
 * 減少・手動＋1による増加）を打ち消す形で現在の在庫数も連動して更新する。
 * 'purchase'（購入完了時の記録）は対象外（買い物リストの購入完了処理でのみ扱う）。
 */
export async function deleteStockLogAndRevertStock(log: StockLog): Promise<void> {
  await db.transaction('rw', db.stockLogs, db.items, async () => {
    const item = await db.items.get(log.itemId)
    if (item) {
      const nextStock = stockAfterStockLogDeletion(item.stock, log)
      await db.items.update(item.id, { stock: nextStock, updatedAt: Date.now() })
    }
    await db.stockLogs.delete(log.id)
  })
}

/**
 * 履歴の数量・日時を修正する。数量の差分を現在の在庫数にも連動して反映する
 * （日時のみの変更は在庫に影響しない）。
 */
export async function editStockLogAndAdjustStock(
  log: StockLog,
  updates: { quantity: number; date: number },
): Promise<void> {
  await db.transaction('rw', db.stockLogs, db.items, async () => {
    const item = await db.items.get(log.itemId)
    if (item) {
      const nextStock = stockAfterStockLogQuantityEdit(item.stock, log, updates.quantity)
      await db.items.update(item.id, { stock: nextStock, updatedAt: Date.now() })
    }
    await db.stockLogs.update(log.id, { quantity: updates.quantity, date: updates.date })
  })
}
