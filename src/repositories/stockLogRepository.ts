import { db } from '../db/db'
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
