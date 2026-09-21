import type { Item } from '../types'
import { isSoon } from './prediction'
import { isBelowReorderPoint } from './stock'

export type DashboardCategory = 'urgent' | 'soon' | 'sufficient'

export function categorizeItem(item: Item, daysUntilEmpty: number | undefined): DashboardCategory {
  if (isBelowReorderPoint(item.stock, item.reorderPoint)) return 'urgent'
  if (isSoon(daysUntilEmpty)) return 'soon'
  return 'sufficient'
}

export function groupItemsByCategory(
  items: Item[],
  daysUntilEmptyByItemId: Map<string, number | undefined>,
): Record<DashboardCategory, Item[]> {
  const groups: Record<DashboardCategory, Item[]> = { urgent: [], soon: [], sufficient: [] }
  for (const item of items) {
    const category = categorizeItem(item, daysUntilEmptyByItemId.get(item.id))
    groups[category].push(item)
  }
  return groups
}
