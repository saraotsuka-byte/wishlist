import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Purchase } from '../types'

export function usePurchasesByItem(itemId: string | undefined): Purchase[] {
  return (
    useLiveQuery(
      async () => {
        if (!itemId) return []
        const purchases = await db.purchases.where('itemId').equals(itemId).sortBy('date')
        return purchases.reverse()
      },
      [itemId],
      [],
    ) ?? []
  )
}

export function useAllPurchases(): Purchase[] {
  return (
    useLiveQuery(async () => {
      const purchases = await db.purchases.orderBy('date').toArray()
      return purchases.reverse()
    }, []) ?? []
  )
}
