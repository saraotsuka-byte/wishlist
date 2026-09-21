import type { Category } from '../types'

export const DEFAULT_CATEGORY_NAMES = [
  'キッチン',
  '洗面・バス',
  'トイレ',
  '洗濯',
  '衛生用品',
  '食品ストック',
  'その他',
] as const

export function buildDefaultCategories(idFactory: () => string): Category[] {
  return DEFAULT_CATEGORY_NAMES.map((name, index) => ({
    id: idFactory(),
    name,
    sortOrder: index,
  }))
}
