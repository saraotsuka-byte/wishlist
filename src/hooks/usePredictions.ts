import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db } from '../db/db'
import { computeDailyUsageRate, predictDaysUntilEmpty } from '../domain/prediction'
import type { Item, StockLog } from '../types'

/**
 * 品目ごとの「あと何日で在庫切れになりそうか」を、全在庫ログから計算する。
 * データ不足の場合は undefined を返す。
 */
export function usePredictions(items: Item[]): Map<string, number | undefined> {
  const logs = useLiveQuery(() => db.stockLogs.toArray(), [], []) ?? []

  return useMemo(() => {
    const logsByItemId = new Map<string, StockLog[]>()
    for (const log of logs) {
      const list = logsByItemId.get(log.itemId)
      if (list) list.push(log)
      else logsByItemId.set(log.itemId, [log])
    }

    const now = Date.now()
    const result = new Map<string, number | undefined>()
    for (const item of items) {
      const itemLogs = logsByItemId.get(item.id) ?? []
      const rate = computeDailyUsageRate(itemLogs, now)
      result.set(item.id, predictDaysUntilEmpty(item.stock, rate))
    }
    return result
  }, [items, logs])
}
