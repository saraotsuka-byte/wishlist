/**
 * 在庫増減に関する純粋関数群。DBやUIに依存しない。
 */

export function nextStockAfterUse(currentStock: number, amount: number): number {
  if (amount <= 0) throw new Error('amount must be positive')
  return Math.max(0, currentStock - amount)
}

export function nextStockAfterPurchase(currentStock: number, amount: number): number {
  if (amount <= 0) throw new Error('amount must be positive')
  return currentStock + amount
}

export function nextStockAfterAdjust(newStock: number): number {
  if (newStock < 0) throw new Error('stock cannot be negative')
  return newStock
}

export function adjustDelta(currentStock: number, newStock: number): number {
  return newStock - currentStock
}

export function isBelowReorderPoint(stock: number, reorderPoint: number): boolean {
  return stock <= reorderPoint
}
