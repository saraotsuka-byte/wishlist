import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { ItemStorePrice } from '../types'

export function useAllItemStorePrices(): ItemStorePrice[] {
  return useLiveQuery(() => db.itemStorePrices.toArray(), [], []) ?? []
}
