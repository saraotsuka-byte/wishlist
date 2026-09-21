import type { Item } from '../types'

export function canDeleteCategory(items: Item[], categoryId: string): boolean {
  return !items.some((item) => item.categoryId === categoryId)
}
