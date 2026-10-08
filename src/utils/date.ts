export const DAY_MS = 24 * 60 * 60 * 1000

export function monthKey(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key: string): string {
  const [, month] = key.split('-')
  return `${Number(month)}月`
}

/** `<input type="date">` 用の `YYYY-MM-DD` 文字列に変換する。 */
export function toDateInputValue(timestamp: number): string {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * `<input type="date">` の文字列をタイムスタンプに変換する。
 * 時刻部分は `fallback`（通常は編集前の元の日時）の時刻をそのまま引き継ぐ。
 * 不正な値の場合は `fallback` を返す。
 */
export function fromDateInputValue(value: string, fallback: number): number {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return fallback
  const original = new Date(fallback)
  const next = new Date(
    y,
    m - 1,
    d,
    original.getHours(),
    original.getMinutes(),
    original.getSeconds(),
    original.getMilliseconds(),
  )
  return Number.isNaN(next.getTime()) ? fallback : next.getTime()
}
