import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { ShoppingListEntry } from '../types'

export function useShoppingListEntries(): ShoppingListEntry[] {
  return useLiveQuery(() => db.shoppingListEntries.toArray(), [], []) ?? []
}
