import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { StockLog } from '../types'

export function useStockLogsByItem(itemId: string | undefined): StockLog[] {
  return (
    useLiveQuery(
      async () => {
        if (!itemId) return []
        const logs = await db.stockLogs.where('itemId').equals(itemId).sortBy('date')
        return logs.reverse()
      },
      [itemId],
      [],
    ) ?? []
  )
}
