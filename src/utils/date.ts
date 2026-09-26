export const DAY_MS = 24 * 60 * 60 * 1000

export function monthKey(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key: string): string {
  const [, month] = key.split('-')
  return `${Number(month)}月`
}
