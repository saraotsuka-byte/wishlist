import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { ItemStorePrice } from '../types'

export function useItemStorePrices(itemId: string | undefined): ItemStorePrice[] {
  return (
    useLiveQuery(
      () => (itemId ? db.itemStorePrices.where('itemId').equals(itemId).toArray() : []),
      [itemId],
      [],
    ) ?? []
  )
}
