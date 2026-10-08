/**
 * 「1個あたりの平均消費日数」に関する純粋関数群。DBやUIに依存しない。
 *
 * ダッシュボード・買い物リストで使う `domain/prediction.ts` の
 * `computeDailyUsageRate`（直近90日の総消費量ベースの消費ペース）とは別の指標。
 * ここでは「連続する開封日の間隔」から1個あたりの消費日数を直接推定する。
 */
import type { StockLog } from '../types'
import { DAY_MS } from '../utils/date'

export const MIN_OPENING_EVENTS_FOR_PACE = 2
export const PACE_INTERVAL_SAMPLE_SIZE = 3

export interface OpeningEvent {
  /** そのイベント内で最も早い開封時刻（表示用） */
  date: number
  /** 同じ日にまとめて開封された数量の合計 */
  quantity: number
}

/**
 * 'use'（開封）ログを日付単位でグループ化する。
 * 同じ日に複数個を開封した場合（「－」を連続で押した場合）、1回の開封イベントとして
 * まとめることで、間隔計算が不自然に短くなって予測を乱すことを防ぐ。
 */
export function groupOpeningEvents(logs: StockLog[]): OpeningEvent[] {
  const byDay = new Map<string, OpeningEvent>()

  for (const log of logs) {
    if (log.type !== 'use') continue
    const d = new Date(log.date)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const existing = byDay.get(key)
    if (existing) {
      existing.quantity += log.quantity
      existing.date = Math.min(existing.date, log.date)
    } else {
      byDay.set(key, { date: log.date, quantity: log.quantity })
    }
  }

  return Array.from(byDay.values()).sort((a, b) => a.date - b.date)
}

/**
 * 直近の開封間隔から、1個あたりの平均消費日数を推定する。
 *
 * 各間隔は「その間隔の開始時点で開封した数量」で割って1個あたりの日数に正規化する
 * （例: 2個まとめて開封し、次の開封までに10日かかった場合は1個あたり5日と見なす）。
 * これにより、複数個の同時開封があっても見かけ上の間隔だけで誤判定しない。
 * 直近 `sampleSize`（既定3）件の間隔を優先し、古い不規則な消費に引っ張られないようにする。
 *
 * 開封イベントが2件未満（間隔が計算できない）場合は undefined（データ収集中）を返す。
 */
export function computeAverageDaysPerUnit(
  logs: StockLog[],
  sampleSize: number = PACE_INTERVAL_SAMPLE_SIZE,
): number | undefined {
  const events = groupOpeningEvents(logs)
  if (events.length < MIN_OPENING_EVENTS_FOR_PACE) return undefined

  const perUnitIntervals: number[] = []
  for (let i = 1; i < events.length; i++) {
    const intervalDays = (events[i].date - events[i - 1].date) / DAY_MS
    const openedQuantity = events[i - 1].quantity > 0 ? events[i - 1].quantity : 1
    perUnitIntervals.push(intervalDays / openedQuantity)
  }

  const recent = perUnitIntervals.slice(-sampleSize)
  const sum = recent.reduce((acc, value) => acc + value, 0)
  return sum / recent.length
}

/** 最後に開封した日時。開封記録が無ければ undefined。 */
export function lastOpenedDate(logs: StockLog[]): number | undefined {
  const events = groupOpeningEvents(logs)
  return events.length === 0 ? undefined : events[events.length - 1].date
}
