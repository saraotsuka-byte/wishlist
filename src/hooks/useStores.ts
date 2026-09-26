import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Store } from '../types'

export function useStores(): Store[] {
  return useLiveQuery(() => db.stores.orderBy('name').toArray(), [], []) ?? []
}
