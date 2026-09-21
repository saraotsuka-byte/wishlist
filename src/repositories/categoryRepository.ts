import { db } from '../db/db'
import type { Category } from '../types'
import { createId } from '../utils/id'

export async function listCategories(): Promise<Category[]> {
  return db.categories.orderBy('sortOrder').toArray()
}

export async function createCategory(name: string): Promise<Category> {
  const count = await db.categories.count()
  const category: Category = { id: createId(), name, sortOrder: count }
  await db.categories.add(category)
  return category
}

export async function updateCategory(
  id: string,
  changes: Partial<Pick<Category, 'name' | 'sortOrder'>>,
): Promise<void> {
  await db.categories.update(id, changes)
}

export async function deleteCategory(id: string): Promise<void> {
  await db.categories.delete(id)
}
