import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Item } from '../types'

export function useItems(): Item[] {
  return useLiveQuery(() => db.items.orderBy('name').toArray(), [], []) ?? []
}

export function useItem(id: string | undefined): Item | undefined {
  return useLiveQuery(() => (id ? db.items.get(id) : undefined), [id])
}
