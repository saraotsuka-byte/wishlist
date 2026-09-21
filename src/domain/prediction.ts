import type { StockLog } from '../types'
import { DAY_MS } from '../utils/date'

export const MIN_USE_LOGS_FOR_PREDICTION = 2
export const PREDICTION_LOOKBACK_DAYS = 90
export const SOON_THRESHOLD_DAYS = 7

/**
 * 直近の使用記録(type: 'use')から1日あたりの平均消費量を計算する。
 * データが少なすぎる、または記録期間が短すぎる場合は undefined（データ不足）を返す。
 */
export function computeDailyUsageRate(logs: StockLog[], now: number): number | undefined {
  const useLogs = logs
    .filter((log) => log.type === 'use' && log.date >= now - PREDICTION_LOOKBACK_DAYS * DAY_MS)
    .sort((a, b) => a.date - b.date)

  if (useLogs.length < MIN_USE_LOGS_FOR_PREDICTION) return undefined

  const spanDays = (now - useLogs[0].date) / DAY_MS
  if (spanDays < 1) return undefined

  const totalQuantity = useLogs.reduce((sum, log) => sum + log.quantity, 0)
  return totalQuantity / spanDays
}

/**
 * 現在の在庫と1日あたり消費量から、あと何日で在庫が切れるかを計算する。
 * 消費ペースが不明・0以下の場合は undefined（データ不足）を返す。
 */
export function predictDaysUntilEmpty(
  currentStock: number,
  dailyRate: number | undefined,
): number | undefined {
  if (dailyRate === undefined || dailyRate <= 0) return undefined
  if (currentStock <= 0) return 0
  return currentStock / dailyRate
}

export function isSoon(daysUntilEmpty: number | undefined): boolean {
  return daysUntilEmpty !== undefined && daysUntilEmpty <= SOON_THRESHOLD_DAYS
}
