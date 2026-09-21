import { db } from '../db/db'
import type { Store } from '../types'
import { createId } from '../utils/id'

export async function listStores(): Promise<Store[]> {
  return db.stores.orderBy('name').toArray()
}

export async function createStore(name: string, url?: string): Promise<Store> {
  const store: Store = { id: createId(), name, url: url || undefined }
  await db.stores.add(store)
  return store
}

export async function updateStore(
  id: string,
  changes: Partial<Pick<Store, 'name' | 'url'>>,
): Promise<void> {
  await db.stores.update(id, changes)
}

export async function deleteStore(id: string): Promise<void> {
  await db.stores.delete(id)
}
