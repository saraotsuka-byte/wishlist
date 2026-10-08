/**
 * 開封・使用履歴(StockLog)の削除・修正に関する純粋関数群。DBやUIに依存しない。
 *
 * 誤操作（押し間違いなど）の取り消しとして、履歴の削除・修正は現在の在庫数にも
 * 連動して反映する。'purchase'（購入完了時の自動記録）はこの編集機能の対象外
 * （買い物リストの購入完了処理でのみ発生し、Purchaseレコードと対になっているため）。
 */
import type { StockLog, StockLogType } from '../types'

/** ログ1件が記録された時点で在庫に与えた符号付きの影響量。 */
function stockEffect(type: StockLogType, quantity: number): number {
  return type === 'use' ? -quantity : quantity
}

/** 履歴を削除したときの在庫数を計算する（削除 = そのログが与えた影響を打ち消す）。 */
export function stockAfterStockLogDeletion(currentStock: number, log: StockLog): number {
  return Math.max(0, currentStock - stockEffect(log.type, log.quantity))
}

/** 履歴の数量を修正したときの在庫数を計算する（差分のみを在庫に反映する）。 */
export function stockAfterStockLogQuantityEdit(
  currentStock: number,
  log: StockLog,
  newQuantity: number,
): number {
  if (newQuantity <= 0) throw new Error('quantity must be positive')
  const delta = stockEffect(log.type, newQuantity) - stockEffect(log.type, log.quantity)
  return Math.max(0, currentStock + delta)
}
