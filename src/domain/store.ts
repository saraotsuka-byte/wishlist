import type { Item } from '../types'

export function canDeleteStore(items: Item[], storeId: string): boolean {
  return !items.some((item) => item.preferredStoreId === storeId)
}
