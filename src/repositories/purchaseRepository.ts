import { db } from '../db/db'
import type { Purchase } from '../types'
import { createId } from '../utils/id'

export async function listPurchasesByItem(itemId: string): Promise<Purchase[]> {
  const purchases = await db.purchases.where('itemId').equals(itemId).sortBy('date')
  return purchases.reverse()
}

export async function listAllPurchases(): Promise<Purchase[]> {
  const purchases = await db.purchases.orderBy('date').toArray()
  return purchases.reverse()
}

export async function addPurchase(purchase: Omit<Purchase, 'id'>): Promise<Purchase> {
  const record: Purchase = { ...purchase, id: createId() }
  await db.purchases.add(record)
  return record
}
